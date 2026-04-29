using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using ClientSphere.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace ClientSphere.Infrastructure.Services;

public sealed class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? Principal => _httpContextAccessor.HttpContext?.User;

    public Guid? GetCurrentTenantId()
    {
        // Prefer our custom claim, but be defensive in case claim mapping is enabled somewhere.
        var claimValue =
            Principal?.FindFirst("tenant_id")?.Value ??
            Principal?.FindFirst("tid")?.Value ??
            Principal?.FindFirst("http://schemas.microsoft.com/identity/claims/tenantid")?.Value;
        return Guid.TryParse(claimValue, out var tenantId) ? tenantId : null;
    }

    public Guid? GetCurrentUserId()
    {
        var claimValue =
            Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
            Principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

        return Guid.TryParse(claimValue, out var userId) ? userId : null;
    }

    public string? GetCurrentUserRole() => Principal?.FindFirst(ClaimTypes.Role)?.Value;

    public bool IsUserInRole(string role) => Principal?.IsInRole(role) ?? false;
}
