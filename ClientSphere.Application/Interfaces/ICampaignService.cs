using ClientSphere.Application.DTOs.Campaigns;
using ClientSphere.Application.DTOs.Common;

namespace ClientSphere.Application.Interfaces;
public interface ICampaignService
{
    Task<PagedResult<CampaignResponse>> GetAllAsync(int page, int pageSize, CancellationToken ct = default);
    Task<CampaignResponse> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<CampaignResponse> CreateAsync(CreateCampaignRequest request, CancellationToken ct = default);
    Task<CampaignResponse> UpdateAsync(Guid id, UpdateCampaignRequest request, CancellationToken ct = default);
    Task<CampaignResponse> SendAsync(Guid id, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}