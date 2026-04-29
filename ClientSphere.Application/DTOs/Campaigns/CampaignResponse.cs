using System;
using System.Collections.Generic;
using System.Text;

using ClientSphere.Domain.Entities;

namespace ClientSphere.Application.DTOs.Campaigns;

public sealed record CampaignResponse(
    Guid Id,
    Guid TenantId,
    string Name,
    string? Description,
    CampaignStatus Status,
    string? Channel,
    decimal? Budget,
    decimal ActualSpend,
    string? TargetAudience,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? SendGridCampaignId,
    int Impressions,
    int Clicks,
    int Conversions,
    Guid OwnerId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
