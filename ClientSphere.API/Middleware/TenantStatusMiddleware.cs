using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ClientSphere.API.Middleware;

public sealed class TenantStatusMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantStatusMiddleware> _logger;

    public TenantStatusMiddleware(RequestDelegate next, ILogger<TenantStatusMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext db)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Exclude specific paths
        if (path.StartsWith("/api/v1/auth", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/v1/billing", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/v1/webhooks/stripe", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        if (context.User.Identity?.IsAuthenticated == true)
        {
            var tenantIdClaim = context.User.FindFirst("tid")?.Value;
            if (Guid.TryParse(tenantIdClaim, out var tenantId))
            {
                // SuperAdmin is exempt from tenant status checks
                if (context.User.IsInRole(RbacRole.SuperAdmin.ToString()))
                {
                    await _next(context);
                    return;
                }

                // Check tenant status in DB
                var tenantStatus = await db.Tenants
                    .Where(t => t.Id == tenantId)
                    .Select(t => t.Status)
                    .FirstOrDefaultAsync();

                if (tenantStatus != TenantStatus.Active && tenantStatus != TenantStatus.Trialing)
                {
                    _logger.LogWarning("Tenant {TenantId} is not active (Status: {Status}). Blocking request to {Path}.", 
                        tenantId, tenantStatus, path);
                    
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    var message = tenantStatus == TenantStatus.Disabled 
                        ? "Tenant account disabled" 
                        : "Subscription required";
                    await context.Response.WriteAsJsonAsync(new { message });
                    return;
                }
            }
        }

        await _next(context);
    }
}
