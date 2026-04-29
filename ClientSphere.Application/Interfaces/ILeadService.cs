// ClientSphere.Application/Interfaces/ILeadService.cs
using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Leads;

namespace ClientSphere.Application.Interfaces;

public interface ILeadService
{
    Task<PagedResult<LeadResponse>> GetAllAsync(int page, int pageSize, CancellationToken ct = default);
    Task<LeadResponse> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<LeadResponse> CreateAsync(CreateLeadRequest request, int? aiConversionScore, CancellationToken ct = default);
    Task<LeadResponse> UpdateAsync(Guid id, UpdateLeadRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}