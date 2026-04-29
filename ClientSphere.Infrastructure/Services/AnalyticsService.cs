using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ClientSphere.Infrastructure.Services;

public sealed class AnalyticsService : IAnalyticsService
{
    private readonly ApplicationDbContext _db;
    private readonly ITenantService _tenantService;

    public AnalyticsService(ApplicationDbContext db, ITenantService tenantService)
    {
        _db = db;
        _tenantService = tenantService;
    }

    public async Task<DashboardSummary> GetSummaryAsync(CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        // Total revenue (won opportunities)
        var totalRevenue = await _db.Opportunities
            .AsNoTracking()
            .Where(o => o.TenantId == tenantId && o.Stage == OpportunityStage.ClosedWon)
            .SumAsync(o => (decimal?)(o.EstimatedValue ?? 0), ct);

        // Active customers
        var activeCustomers = await _db.Customers
            .AsNoTracking()
            .CountAsync(c => c.TenantId == tenantId && !c.IsDeleted, ct);

        // Open tickets
        var openTickets = await _db.Tickets
            .AsNoTracking()
            .CountAsync(t => t.TenantId == tenantId && 
                (t.Status == TicketStatus.Open || t.Status == TicketStatus.InProgress || t.Status == TicketStatus.Pending), ct);

        // Urgent tickets
        var urgentTickets = await _db.Tickets
            .AsNoTracking()
            .CountAsync(t => t.TenantId == tenantId && t.AiSentimentLabel == AiSentimentLabel.Urgent, ct);

        // Win rate
        var closedWon = await _db.Opportunities
            .AsNoTracking()
            .CountAsync(o => o.TenantId == tenantId && o.Stage == OpportunityStage.ClosedWon, ct);
        
        var closedLost = await _db.Opportunities
            .AsNoTracking()
            .CountAsync(o => o.TenantId == tenantId && o.Stage == OpportunityStage.ClosedLost, ct);
        
        var totalClosed = closedWon + closedLost;
        var winRate = totalClosed > 0 ? (decimal)closedWon / totalClosed * 100 : 0;

        // New customers this month
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var newCustomersMonth = await _db.Customers
            .AsNoTracking()
            .CountAsync(c => c.TenantId == tenantId && c.CreatedAt >= startOfMonth, ct);

        // Revenue growth (simplified - compare this quarter vs last quarter)
        var thisQuarterStart = GetQuarterStart(DateTime.UtcNow);
        var lastQuarterStart = thisQuarterStart.AddMonths(-3);
        
        var thisQuarterRevenue = await _db.Opportunities
            .AsNoTracking()
            .Where(o => o.TenantId == tenantId && o.Stage == OpportunityStage.ClosedWon && o.ClosedAt >= thisQuarterStart)
            .SumAsync(o => (decimal?)(o.EstimatedValue ?? 0), ct);
        
        var lastQuarterRevenue = await _db.Opportunities
            .AsNoTracking()
            .Where(o => o.TenantId == tenantId && o.Stage == OpportunityStage.ClosedWon && 
                o.ClosedAt >= lastQuarterStart && o.ClosedAt < thisQuarterStart)
            .SumAsync(o => (decimal?)(o.EstimatedValue ?? 0), ct);
        
        var revenueGrowth = lastQuarterRevenue > 0 
            ? (thisQuarterRevenue - lastQuarterRevenue) / lastQuarterRevenue * 100 
            : 0;

        return new DashboardSummary(
            TotalRevenue: totalRevenue ?? 0,
            ActiveCustomers: activeCustomers,
            OpenTickets: openTickets,
            UrgentTickets: urgentTickets,
            WinRate: Math.Round(winRate, 1),
            NewCustomersMonth: newCustomersMonth,
            RevenueGrowth: Math.Round(revenueGrowth ?? 0, 1)
        );
    }

    public async Task<IEnumerable<EmployeeSalesStats>> GetSalesByEmployeeAsync(CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var users = await _db.Users
            .AsNoTracking()
            .Where(u => u.TenantId == tenantId && u.IsActive && 
                (u.RbacRole == RbacRole.SalesRep || u.RbacRole == RbacRole.SalesManager))
            .ToListAsync(ct);

        var stats = new List<EmployeeSalesStats>();

        foreach (var user in users)
        {
            var totalOpps = await _db.Opportunities
                .AsNoTracking()
                .CountAsync(o => o.TenantId == tenantId && o.OwnerId == user.Id, ct);

            var wonDeals = await _db.Opportunities
                .AsNoTracking()
                .CountAsync(o => o.TenantId == tenantId && o.OwnerId == user.Id && o.Stage == OpportunityStage.ClosedWon, ct);

            var lostDeals = await _db.Opportunities
                .AsNoTracking()
                .CountAsync(o => o.TenantId == tenantId && o.OwnerId == user.Id && o.Stage == OpportunityStage.ClosedLost, ct);

            var wonValue = await _db.Opportunities
                .AsNoTracking()
                .Where(o => o.TenantId == tenantId && o.OwnerId == user.Id && o.Stage == OpportunityStage.ClosedWon)
                .SumAsync(o => (decimal?)(o.EstimatedValue ?? 0), ct);

            var pipelineValue = await _db.Opportunities
                .AsNoTracking()
                .Where(o => o.TenantId == tenantId && o.OwnerId == user.Id && 
                    o.Stage != OpportunityStage.ClosedWon && o.Stage != OpportunityStage.ClosedLost)
                .SumAsync(o => (decimal?)(o.EstimatedValue ?? 0), ct);

            stats.Add(new EmployeeSalesStats(
                UserId: user.Id,
                FullName: user.FullName,
                Email: user.Email,
                TotalOpportunities: totalOpps,
                WonDeals: wonDeals,
                LostDeals: lostDeals,
                WonValue: wonValue ?? 0,
                PipelineValue: pipelineValue ?? 0
            ));
        }

        return stats.OrderByDescending(s => s.WonValue).ToList();
    }

    public async Task<TicketsOverview> GetTicketsOverviewAsync(CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var totalTickets = await _db.Tickets
            .AsNoTracking()
            .CountAsync(t => t.TenantId == tenantId, ct);

        var openTickets = await _db.Tickets
            .AsNoTracking()
            .CountAsync(t => t.TenantId == tenantId && t.Status == TicketStatus.Open, ct);

        var inProgressTickets = await _db.Tickets
            .AsNoTracking()
            .CountAsync(t => t.TenantId == tenantId && t.Status == TicketStatus.InProgress, ct);

        var resolvedTickets = await _db.Tickets
            .AsNoTracking()
            .CountAsync(t => t.TenantId == tenantId && t.Status == TicketStatus.Resolved, ct);

        var closedTickets = await _db.Tickets
            .AsNoTracking()
            .CountAsync(t => t.TenantId == tenantId && t.Status == TicketStatus.Closed, ct);

        var highPriorityTickets = await _db.Tickets
            .AsNoTracking()
            .CountAsync(t => t.TenantId == tenantId && 
                (t.Priority == TicketPriority.High || t.Priority == TicketPriority.Critical), ct);

        // Average resolution time (for resolved/closed tickets)
        var resolvedTicketsWithTime = await _db.Tickets
            .AsNoTracking()
            .Where(t => t.TenantId == tenantId && t.ResolvedAt.HasValue)
            .ToListAsync(ct);

        decimal averageResolutionHours = 0;
        if (resolvedTicketsWithTime.Any())
        {
            var totalHours = resolvedTicketsWithTime
                .Sum(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalHours);
            
            averageResolutionHours = (decimal)totalHours / resolvedTicketsWithTime.Count;
        }

        return new TicketsOverview(
            TotalTickets: totalTickets,
            OpenTickets: openTickets,
            InProgressTickets: inProgressTickets,
            ResolvedTickets: resolvedTickets,
            ClosedTickets: closedTickets,
            AverageResolutionHours: Math.Round(averageResolutionHours, 1),
            HighPriorityTickets: highPriorityTickets
        );
    }

    public async Task<IEnumerable<CampaignPerformance>> GetCampaignPerformanceAsync(CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var campaigns = await _db.Campaigns
            .AsNoTracking()
            .Where(c => c.TenantId == tenantId)
            .ToListAsync(ct);

        return campaigns.Select(c => new CampaignPerformance(
            CampaignId: c.Id,
            CampaignName: c.Name,
            Status: c.Status.ToString(),
            Budget: c.Budget ?? 0,
            ActualSpend: c.ActualSpend,
            Impressions: c.Impressions,
            Clicks: c.Clicks,
            Conversions: c.Conversions,
            ClickThroughRate: c.Impressions > 0 ? (decimal)c.Clicks / c.Impressions * 100 : 0,
            ConversionRate: c.Clicks > 0 ? (decimal)c.Conversions / c.Clicks * 100 : 0
        )).ToList();
    }

    private static DateTime GetQuarterStart(DateTime date)
    {
        var quarter = (date.Month - 1) / 3 + 1;
        var quarterStartMonth = (quarter - 1) * 3 + 1;
        return new DateTime(date.Year, quarterStartMonth, 1);
    }
}
