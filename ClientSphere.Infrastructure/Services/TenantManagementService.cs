using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Tenants;
using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ClientSphere.Infrastructure.Services;

public sealed class TenantManagementService : ITenantManagementService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<TenantManagementService> _logger;

    public TenantManagementService(ApplicationDbContext db, ILogger<TenantManagementService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<PagedResult<TenantResponse>> GetAllAsync(
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 25 : Math.Min(pageSize, 200);

        var query = _db.Tenants
            .AsNoTracking()
            .OrderByDescending(t => t.CreatedAt);

        var total = await query.CountAsync(ct);
        var tenants = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = tenants.Select(ToResponse).ToList();
        return new PagedResult<TenantResponse>(items, total, page, pageSize);
    }

    public async Task<TenantResponse> GetByIdAsync(Guid tenantId, CancellationToken ct = default)
    {
        var tenant = await _db.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct);

        if (tenant is null)
        {
            throw new KeyNotFoundException($"Tenant '{tenantId}' not found.");
        }

        return ToResponse(tenant);
    }

    public async Task<TenantResponse> UpdateAsync(Guid tenantId, UpdateTenantRequest request, CancellationToken ct = default)
    {
        var tenant = await _db.Tenants
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct);

        if (tenant is null)
        {
            throw new KeyNotFoundException($"Tenant '{tenantId}' not found.");
        }

        tenant.Status = request.Status;
        tenant.SubscriptionTier = request.SubscriptionTier;
        tenant.MaxUsers = request.MaxUsers;
        tenant.SubscriptionEndsAt = request.SubscriptionEndsAt;

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Updated tenant {TenantId} status to {Status}.", tenant.Id, tenant.Status);
        return ToResponse(tenant);
    }

    public async Task<TenantResponse> UpdateStatusAsync(Guid tenantId, string status, CancellationToken ct = default)
    {
        var tenant = await _db.Tenants
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct);

        if (tenant is null)
        {
            throw new KeyNotFoundException($"Tenant '{tenantId}' not found.");
        }

        if (!Enum.TryParse<TenantStatus>(status, true, out var tenantStatus))
        {
            throw new ArgumentException($"Invalid status: {status}");
        }

        tenant.Status = tenantStatus;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("SuperAdmin updated tenant {TenantId} status to {Status}.", tenantId, tenantStatus);
        return ToResponse(tenant);
    }

    private static TenantResponse ToResponse(Tenant t) => new(
        Id: t.Id,
        Name: t.Name,
        Slug: t.Slug,
        Status: t.Status,
        SubscriptionTier: t.SubscriptionTier,
        TrialEndsAt: t.TrialEndsAt,
        SubscriptionEndsAt: t.SubscriptionEndsAt,
        MaxUsers: t.MaxUsers,
        CreatedAt: t.CreatedAt);
}
