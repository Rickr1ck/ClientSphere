using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.DTOs.Campaigns;

public sealed record CreateCampaignRequest(
    string Name,
    string? Description,
    string? Channel,
    decimal? Budget,
    string? TargetAudience,
    DateOnly? StartDate,
    DateOnly? EndDate
);
