using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Tenants;

namespace ClientSphere.Application.Interfaces;

public interface ITenantManagementService
{
    Task<PagedResult<TenantResponse>> GetAllAsync(
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<TenantResponse> GetByIdAsync(
        Guid tenantId,
        CancellationToken ct = default);

    Task<TenantResponse> UpdateAsync(
        Guid tenantId,
        UpdateTenantRequest request,
        CancellationToken ct = default);

    Task<TenantResponse> UpdateStatusAsync(
        Guid tenantId,
        string status,
        CancellationToken ct = default);
}
