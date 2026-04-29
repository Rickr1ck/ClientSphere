using ClientSphere.Domain.Common;


namespace ClientSphere.Domain.Entities;

public enum CampaignStatus
{
    Draft, Scheduled, Active, Paused, Completed, Cancelled
}

public class MarketingCampaign : AuditableTenantEntity
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public CampaignStatus Status { get; set; } = CampaignStatus.Draft;
    public string? Channel { get; set; }
    public decimal? Budget { get; set; }   // NUMERIC(18,2) NULL
    public decimal ActualSpend { get; set; } = 0m;
    public string? TargetAudience { get; set; }
    public DateOnly? StartDate { get; set; }   // DATE
    public DateOnly? EndDate { get; set; }   // DATE
    public string? SendGridCampaignId { get; set; }
    public int Impressions { get; set; } = 0;
    public int Clicks { get; set; } = 0;
    public int Conversions { get; set; } = 0;
    public Guid OwnerId { get; set; }

    // Navigation
    public User Owner { get; set; } = default!;
}