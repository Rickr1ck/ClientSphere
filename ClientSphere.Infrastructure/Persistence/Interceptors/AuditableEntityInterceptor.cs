using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace ClientSphere.Infrastructure.Persistence.Interceptors;

public sealed class AuditableEntityInterceptor : SaveChangesInterceptor
{
    private readonly ITenantService _tenantService;

    public AuditableEntityInterceptor(ITenantService tenantService)
    {
        _tenantService = tenantService;
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        ApplyAuditInformation(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        ApplyAuditInformation(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void ApplyAuditInformation(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var actorId = _tenantService.GetCurrentUserId();
        var tenantId = _tenantService.GetCurrentTenantId();

        foreach (var entry in context.ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.CreatedBy ??= actorId;

                    if (entry.Entity is AuditableTenantEntity tenantEntity &&
                        tenantEntity.TenantId == Guid.Empty)
                    {
                        if (tenantId.HasValue)
                        {
                            tenantEntity.TenantId = tenantId.Value;
                        }
                        else
                        {
                            // Prevent "phantom" rows that get inserted with TenantId=0000... and then never show up
                            // because global query filters require a tenant context.
                            throw new UnauthorizedAccessException(
                                "Tenant context is missing. Ensure the request is authenticated and includes the 'tid' claim.");
                        }
                    }
                    break;

                case EntityState.Modified:
                    entry.Property(e => e.CreatedAt).IsModified = false;
                    entry.Property(e => e.CreatedBy).IsModified = false;
                    entry.Entity.UpdatedAt = now;

                    if (entry.Entity is AuditableTenantEntity)
                    {
                        entry.Property(nameof(AuditableTenantEntity.TenantId)).IsModified = false;
                    }
                    break;

                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.UpdatedAt = now;
                    entry.Property(e => e.CreatedAt).IsModified = false;
                    entry.Property(e => e.CreatedBy).IsModified = false;

                    if (entry.Entity is AuditableTenantEntity)
                    {
                        entry.Property(nameof(AuditableTenantEntity.TenantId)).IsModified = false;
                    }
                    break;
            }
        }
    }
}
