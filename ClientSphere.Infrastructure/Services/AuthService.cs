using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using ClientSphere.Application.DTOs.Auth;
using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Common;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace ClientSphere.Infrastructure.Services;

public sealed class AuthService : IAuthService
{
    private static readonly string DummyPasswordHash = BCrypt.Net.BCrypt.HashPassword(
        "ClientSphere.InvalidPassword!",
        workFactor: 10);

    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthService> _logger;

    private string JwtSecret =>
        _config["Jwt:Secret"] ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

    private string JwtIssuer =>
        _config["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");

    private string JwtAudience =>
        _config["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience is not configured.");

    private int JwtExpiryMinutes => int.TryParse(_config["Jwt:ExpiryMinutes"], out var minutes)
        ? minutes
        : 60;

    public AuthService(
        ApplicationDbContext db,
        IConfiguration config,
        ILogger<AuthService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterTenantAsync(
        RegisterTenantRequest request,
        CancellationToken ct = default)
    {
        var normalizedSlug = NormalizeSlug(request.TenantSlug);
        var normalizedEmail = NormalizeEmail(request.AdminEmail);
        var now = DateTimeOffset.UtcNow;
        var tenantId = Guid.NewGuid();
        var adminId = Guid.NewGuid();

        _logger.LogInformation(
            "Provisioning tenant {TenantSlug} for admin {AdminEmail}.",
            normalizedSlug,
            normalizedEmail);

        var slugExists = await _db.Tenants
            .IgnoreQueryFilters()
            .AnyAsync(t => t.Slug == normalizedSlug, ct);

        if (slugExists)
        {
            throw new InvalidOperationException(
                $"Tenant slug '{normalizedSlug}' is already in use.");
        }

        var tenant = new Tenant
        {
            Id = tenantId,
            Name = request.TenantName.Trim(),
            Slug = normalizedSlug,
            Status = TenantStatus.PendingPayment,
            SubscriptionTier = SubscriptionTier.Free,
            TrialEndsAt = now.AddDays(14),
            MaxUsers = 5,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = adminId
        };

        var adminUser = new User
        {
            Id = adminId,
            TenantId = tenantId,
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.AdminPassword, workFactor: 12),
            FirstName = request.AdminFirstName.Trim(),
            LastName = request.AdminLastName.Trim(),
            RbacRole = RbacRole.TenantAdmin,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = adminId
        };

        try
        {
            _db.Tenants.Add(tenant);
            _db.Users.Add(adminUser);
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error while provisioning tenant {TenantSlug}.", normalizedSlug);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while provisioning tenant {TenantSlug}.", normalizedSlug);
            throw;
        }

        _logger.LogInformation(
            "Tenant {TenantSlug} provisioned successfully with TenantId {TenantId}.",
            normalizedSlug,
            tenantId);

        var token = GenerateJwt(adminUser, tenant);
        return BuildAuthResponse(adminUser, token);
    }

    public async Task<AuthResponse> LoginAsync(
        LoginRequest request,
        CancellationToken ct = default)
    {
        var normalizedEmail = NormalizeEmail(request.Email);

        _logger.LogInformation(
            "Login attempt for {Email} in tenant {TenantId}.",
            normalizedEmail,
            request.TenantId);

        var user = await _db.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u =>
                u.Email == normalizedEmail &&
                u.TenantId == request.TenantId &&
                !u.IsDeleted &&
                !u.Tenant.IsDeleted,
                ct);

        var passwordHash = user?.PasswordHash ?? DummyPasswordHash;
        var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, passwordHash);

        if (user is null || !passwordValid || !user.IsActive)
        {
            _logger.LogWarning(
                "Rejected login for {Email} in tenant {TenantId}.",
                normalizedEmail,
                request.TenantId);
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        if (user.Tenant.Status is TenantStatus.Disabled)
        {
            _logger.LogWarning(
                "Rejected login for {Email} because tenant {TenantId} is {TenantStatus}.",
                normalizedEmail,
                request.TenantId,
                user.Tenant.Status);
            throw new UnauthorizedAccessException(
                "Tenant account disabled. Contact support.");
        }

        user.LastLoginAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Login succeeded for user {UserId} in tenant {TenantId}.",
            user.Id,
            user.TenantId);

        var token = GenerateJwt(user, user.Tenant);
        return BuildAuthResponse(user, token);
    }

    private string GenerateJwt(User user, Tenant tenant)
    {
        if (JwtSecret.Length < 32)
        {
            throw new InvalidOperationException("Jwt:Secret must be at least 32 characters.");
        }

        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(JwtExpiryMinutes);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var roleSnake = EnumNaming.ToSnakeCase(user.RbacRole);
        var roleName = user.RbacRole.ToString();

        var roles = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            roleSnake,
            roleName
        };

        // API uses this alias for destructive actions (Phase 3 requirement).
        if (user.RbacRole is RbacRole.TenantAdmin or RbacRole.SuperAdmin)
        {
            roles.Add("CompanyAdmin");
        }

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim("tid", user.TenantId.ToString()),
            new Claim("tenant_id", user.TenantId.ToString()),
            new Claim("tslug", tenant.Slug),
            new Claim("tenant_status", tenant.Status.ToString())
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
            claims.Add(new Claim("role", role));
        }

        var token = new JwtSecurityToken(
            issuer: JwtIssuer,
            audience: JwtAudience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private AuthResponse BuildAuthResponse(User user, string token) => new(
        AccessToken: token,
        TokenType: "Bearer",
        ExpiresInSeconds: JwtExpiryMinutes * 60,
        UserId: user.Id,
        TenantId: user.TenantId,
        Email: user.Email,
        FullName: user.FullName,
        // Frontend expects PascalCase role names (e.g., "TenantAdmin").
        Role: user.RbacRole.ToString(),
        TenantStatus: user.Tenant.Status.ToString(),
        RequiresPayment: user.Tenant.Status == TenantStatus.PendingPayment);

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static string NormalizeSlug(string slug) => slug.Trim().ToLowerInvariant();

    public async Task<bool> IsTenantSlugTakenAsync(string slug, CancellationToken ct = default)
    {
        var normalizedSlug = NormalizeSlug(slug);
        return await _db.Tenants
            .IgnoreQueryFilters()
            .AnyAsync(t => t.Slug == normalizedSlug, ct);
    }
}
