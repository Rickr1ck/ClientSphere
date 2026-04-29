using ClientSphere.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClientSphere.API.Controllers;

[ApiController]
[Route("api/v1/analytics")]
[Authorize]
public sealed class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        IAnalyticsService analyticsService,
        ILogger<AnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    [HttpGet("summary")]
    [Authorize(Policy = "ReadOnlyOrAbove")]
    public async Task<IActionResult> GetSummary(CancellationToken ct = default)
    {
        var summary = await _analyticsService.GetSummaryAsync(ct);
        return Ok(summary);
    }

    [HttpGet("sales-by-employee")]
    [Authorize(Policy = "AnalyticsAdmin")]
    public async Task<IActionResult> GetSalesByEmployee(CancellationToken ct = default)
    {
        var stats = await _analyticsService.GetSalesByEmployeeAsync(ct);
        return Ok(stats);
    }

    [HttpGet("tickets-overview")]
    [Authorize(Policy = "AnalyticsAdmin")]
    public async Task<IActionResult> GetTicketsOverview(CancellationToken ct = default)
    {
        var overview = await _analyticsService.GetTicketsOverviewAsync(ct);
        return Ok(overview);
    }

    [HttpGet("campaign-performance")]
    [Authorize(Policy = "AnalyticsAdmin")]
    public async Task<IActionResult> GetCampaignPerformance(CancellationToken ct = default)
    {
        var performance = await _analyticsService.GetCampaignPerformanceAsync(ct);
        return Ok(performance);
    }
}
