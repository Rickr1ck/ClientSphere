using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Opportunities;

namespace ClientSphere.Application.Interfaces;

public interface IOpportunityService
{
    Task<PagedResult<OpportunityResponse>> GetAsync(
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<OpportunityResponse> GetByIdAsync(
        Guid opportunityId,
        CancellationToken ct = default);

    Task<PagedResult<OpportunityResponse>> GetByCustomerAsync(
        Guid customerId,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<OpportunityResponse> CreateAsync(
        CreateOpportunityRequest request,
        CancellationToken ct = default);

    Task<OpportunityResponse> UpdateAsync(
        Guid opportunityId,
        UpdateOpportunityRequest request,
        CancellationToken ct = default);

    Task<OpportunityResponse> UpdateStageAsync(
        Guid opportunityId,
        UpdateOpportunityStageRequest request,
        CancellationToken ct = default);

    Task DeleteAsync(
        Guid opportunityId,
        CancellationToken ct = default);
}
