using BCrypt.Net;
using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;

namespace ClientSphere.API.Seeding;

public static class DevSeeder
{
    // Dev-only defaults (override via config: Seed:*).
    // NOTE: Don't use these in production.
    private static readonly Guid DefaultSystemTenantId =
        Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly Guid DefaultSuperAdminUserId =
        Guid.Parse("22222222-2222-2222-2222-222222222222");

    private const string DefaultSystemTenantSlug = "clientsphere-system";
    private const string DefaultSystemTenantName = "ClientSphere System";

    private const string DefaultSuperAdminEmail = "superadmin@clientsphere.local";
    private const string DefaultSuperAdminPassword = "SuperAdmin!123456";

    public static async Task SeedSuperAdminAsync(
        ApplicationDbContext db,
        IConfiguration config,
        ILogger logger,
        CancellationToken ct = default)
    {
        // If schema isn't applied yet (no tables), skip cleanly.
        try
        {
            _ = await db.Tenants.IgnoreQueryFilters().AnyAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex,
                "Dev seeding skipped: database schema not available yet (did you run Phase 1 DDL on this database?).");
            return;
        }

        var tenantId = Guid.TryParse(config["Seed:SystemTenantId"], out var parsedTenantId)
            ? parsedTenantId
            : DefaultSystemTenantId;

        var userId = Guid.TryParse(config["Seed:SuperAdminUserId"], out var parsedUserId)
            ? parsedUserId
            : DefaultSuperAdminUserId;

        var tenantSlug = config["Seed:SystemTenantSlug"] ?? DefaultSystemTenantSlug;
        var tenantName = config["Seed:SystemTenantName"] ?? DefaultSystemTenantName;

        var email = (config["Seed:SuperAdminEmail"] ?? DefaultSuperAdminEmail).Trim().ToLowerInvariant();
        var password = config["Seed:SuperAdminPassword"] ?? DefaultSuperAdminPassword;

        // Ensure system tenant exists
        var tenant = await db.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Slug == tenantSlug, ct);

        if (tenant is null)
        {
            // Diagnostics: verify EF Core is actually mapping our CLR enums to PostgreSQL enum types.
            // If this logs a converter like EnumToNumber, EF is still sending integers (and Postgres will reject them).
            try
            {
                var entityType = db.Model.FindEntityType(typeof(Tenant));
                var statusProp = entityType?.FindProperty(nameof(Tenant.Status));
                var tierProp = entityType?.FindProperty(nameof(Tenant.SubscriptionTier));

                var typeMappingSource = db.GetService<IRelationalTypeMappingSource>();
                var statusMapping = statusProp is null ? null : typeMappingSource.FindMapping(statusProp);
                var tierMapping = tierProp is null ? null : typeMappingSource.FindMapping(tierProp);

                logger.LogInformation(
                    "EF mapping Tenant.Status: ColumnType={ColumnType} StoreType={StoreType} Converter={Converter}",
                    statusProp?.GetColumnType(),
                    statusMapping?.StoreType,
                    statusMapping?.Converter?.GetType().FullName);

                logger.LogInformation(
                    "EF mapping Tenant.SubscriptionTier: ColumnType={ColumnType} StoreType={StoreType} Converter={Converter}",
                    tierProp?.GetColumnType(),
                    tierMapping?.StoreType,
                    tierMapping?.Converter?.GetType().FullName);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Unable to log EF enum type mappings (non-fatal).");
            }

            tenant = new Tenant
            {
                Id = tenantId,
                Name = tenantName,
                Slug = tenantSlug,
                Status = TenantStatus.Active,
                SubscriptionTier = SubscriptionTier.Enterprise,
                MaxUsers = short.MaxValue,
                IsDeleted = false
            };

            db.Tenants.Add(tenant);
            await db.SaveChangesAsync(ct);
        }

        // Ensure super admin user exists (must ignore query filters because there's no tenant context at startup)
        var existingUser = await db.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == email, ct);

        if (existingUser is null)
        {
            var now = DateTimeOffset.UtcNow;
            var hash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

            var user = new User
            {
                Id = userId,
                TenantId = tenant.Id,
                Email = email,
                PasswordHash = hash,
                FirstName = "Super",
                LastName = "Admin",
                RbacRole = RbacRole.SuperAdmin,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = userId,
                IsDeleted = false
            };

            db.Users.Add(user);
            await db.SaveChangesAsync(ct);
        }

        logger.LogWarning(
            "DEV SEED: Super Admin ready. TenantId={TenantId} Email={Email} Password={Password}",
            tenant.Id,
            email,
            password);
    }
}
