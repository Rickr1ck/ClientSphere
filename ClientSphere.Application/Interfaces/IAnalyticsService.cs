namespace ClientSphere.Application.Interfaces;

public interface IAnalyticsService
{
    Task<DashboardSummary> GetSummaryAsync(CancellationToken ct = default);
    Task<IEnumerable<EmployeeSalesStats>> GetSalesByEmployeeAsync(CancellationToken ct = default);
    Task<TicketsOverview> GetTicketsOverviewAsync(CancellationToken ct = default);
    Task<IEnumerable<CampaignPerformance>> GetCampaignPerformanceAsync(CancellationToken ct = default);
}

// DTOs for Analytics
public sealed record DashboardSummary(
    decimal TotalRevenue,
    int ActiveCustomers,
    int OpenTickets,
    int UrgentTickets,
    decimal WinRate,
    int NewCustomersMonth,
    decimal RevenueGrowth
);

public sealed record EmployeeSalesStats(
    Guid UserId,
    string FullName,
    string Email,
    int TotalOpportunities,
    int WonDeals,
    int LostDeals,
    decimal WonValue,
    decimal PipelineValue
);

public sealed record TicketsOverview(
    int TotalTickets,
    int OpenTickets,
    int InProgressTickets,
    int ResolvedTickets,
    int ClosedTickets,
    decimal AverageResolutionHours,
    int HighPriorityTickets
);

public sealed record CampaignPerformance(
    Guid CampaignId,
    string CampaignName,
    string Status,
    decimal Budget,
    decimal ActualSpend,
    int Impressions,
    int Clicks,
    int Conversions,
    decimal ClickThroughRate,
    decimal ConversionRate
);
