using System;
using System.Collections.Generic;
using System.Text;

using ClientSphere.Domain.Entities;

namespace ClientSphere.Application.DTOs.Campaigns;

public sealed record UpdateCampaignRequest(
    string Name,
    string? Description,
    CampaignStatus Status,
    string? Channel,
    decimal? Budget,
    decimal ActualSpend,
    string? TargetAudience,
    DateOnly? StartDate,
    DateOnly? EndDate,
    Guid? OwnerId
);
