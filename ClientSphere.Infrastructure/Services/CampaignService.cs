using AutoMapper;
using ClientSphere.Application.DTOs.Campaigns;
using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Infrastructure.Services;
public sealed class CampaignService : ICampaignService
{
    private readonly ApplicationDbContext _db;
    private readonly ITenantService _tenantService;
    private readonly IMapper _mapper;
    private readonly ISendGridService _sendGrid;
    private readonly ILogger<CampaignService> _logger;

    public CampaignService(
        ApplicationDbContext db,
        ITenantService tenantService,
        IMapper mapper,
        ISendGridService sendGrid,
        ILogger<CampaignService> logger)
    {
        _db = db;
        _tenantService = tenantService;
        _mapper = mapper;
        _sendGrid = sendGrid;
        _logger = logger;
    }

    public async Task<PagedResult<CampaignResponse>> GetAllAsync(
        int page, int pageSize, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var query = _db.Campaigns.AsNoTracking().Where(c => c.TenantId == tenantId);
        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<CampaignResponse>(
            _mapper.Map<List<CampaignResponse>>(items), total, page, pageSize);
    }

    public async Task<CampaignResponse> GetByIdAsync(
        Guid id, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var campaign = await _db.Campaigns.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Campaign {id} not found.");

        return _mapper.Map<CampaignResponse>(campaign);
    }

    public async Task<CampaignResponse> CreateAsync(
        CreateCampaignRequest request, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");
        Guid userId = _tenantService.GetCurrentUserId() ?? throw new UnauthorizedAccessException("User context is missing.");
        string userRole = _tenantService.GetCurrentUserRole() ?? throw new UnauthorizedAccessException("User role is missing.");

        // STRICT RBAC: TenantAdmin CANNOT create campaigns (monitor-only role)
        if (userRole == "TenantAdmin")
        {
            throw new UnauthorizedAccessException("Tenant Admins cannot create campaigns. This is a monitor-only role.");
        }

        if (userRole != "SuperAdmin" && userRole != "MarketingManager")
        {
            throw new UnauthorizedAccessException("You do not have permission to create campaigns.");
        }

        var campaign = _mapper.Map<MarketingCampaign>(request);
        campaign.TenantId = tenantId;
        campaign.OwnerId = userId; // AUTOMATIC: from JWT

        _db.Campaigns.Add(campaign);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Campaign created. Id: {Id}, TenantId: {TenantId}", campaign.Id, tenantId);
        return _mapper.Map<CampaignResponse>(campaign);
    }

    public async Task<CampaignResponse> UpdateAsync(
        Guid id, UpdateCampaignRequest request, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");
        string userRole = _tenantService.GetCurrentUserRole() ?? throw new UnauthorizedAccessException("User role is missing.");

        // STRICT RBAC: TenantAdmin CANNOT update campaigns (monitor-only role)
        if (userRole == "TenantAdmin")
        {
            throw new UnauthorizedAccessException("Tenant Admins cannot update campaigns. This is a monitor-only role.");
        }

        if (userRole != "SuperAdmin" && userRole != "MarketingManager")
        {
            throw new UnauthorizedAccessException("You do not have permission to update campaigns.");
        }

        var campaign = await _db.Campaigns
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Campaign {id} not found.");

        _mapper.Map(request, campaign);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Campaign updated. Id: {Id}, TenantId: {TenantId}", id, tenantId);
        return _mapper.Map<CampaignResponse>(campaign);
    }

    public async Task<CampaignResponse> SendAsync(
        Guid id, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");
        string userRole = _tenantService.GetCurrentUserRole() ?? throw new UnauthorizedAccessException("User role is missing.");

        // STRICT RBAC: TenantAdmin CANNOT send campaigns (monitor-only role)
        if (userRole == "TenantAdmin")
        {
            throw new UnauthorizedAccessException("Tenant Admins cannot send campaigns. This is a monitor-only role.");
        }

        if (userRole != "SuperAdmin" && userRole != "MarketingManager")
        {
            throw new UnauthorizedAccessException("You do not have permission to send campaigns.");
        }

        var campaign = await _db.Campaigns
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Campaign {id} not found.");

        if (campaign.Status != CampaignStatus.Draft &&
            campaign.Status != CampaignStatus.Scheduled)
            throw new InvalidOperationException(
                $"Campaign cannot be sent from status '{campaign.Status}'.");

        // Create in SendGrid if not already provisioned
        if (string.IsNullOrEmpty(campaign.SendGridCampaignId))
        {
            campaign.SendGridCampaignId = await _sendGrid.CreateCampaignAsync(
                campaign.Name,
                subject: campaign.Name,
                htmlContent: campaign.Description ?? campaign.Name,
                ct);
        }

        await _sendGrid.SendCampaignAsync(campaign.SendGridCampaignId, ct);

        campaign.Status = CampaignStatus.Active;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Campaign sent. Id: {Id}, SendGridId: {SgId}, TenantId: {TenantId}",
            id, campaign.SendGridCampaignId, tenantId);

        return _mapper.Map<CampaignResponse>(campaign);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var campaign = await _db.Campaigns
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Campaign {id} not found.");

        if (!_tenantService.IsUserInRole("TenantAdmin") && 
            !_tenantService.IsUserInRole("SuperAdmin"))
        {
            throw new UnauthorizedAccessException("You do not have permission to delete campaigns.");
        }

        campaign.IsDeleted = true;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Campaign soft-deleted. Id: {Id}, TenantId: {TenantId}", id, tenantId);
    }
}
