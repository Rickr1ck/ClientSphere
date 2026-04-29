using ClientSphere.Application.DTOs.Tenants;
using ClientSphere.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClientSphere.API.Controllers;

[ApiController]
[Route("api/v1/admin/tenants")]
[Authorize(Roles = "SuperAdmin")]
public sealed class TenantsController : ControllerBase
{
    private readonly ITenantManagementService _tenantService;
    private readonly ILogger<TenantsController> _logger;

    public TenantsController(ITenantManagementService tenantService, ILogger<TenantsController> logger)
    {
        _tenantService = tenantService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        var result = await _tenantService.GetAllAsync(page, pageSize, ct);
        return Ok(result);
    }

    [HttpGet("{tenantId:guid}")]
    public async Task<IActionResult> GetById(
        Guid tenantId,
        CancellationToken ct)
    {
        var result = await _tenantService.GetByIdAsync(tenantId, ct);
        return Ok(result);
    }

    [HttpPut("{tenantId:guid}")]
    public async Task<IActionResult> Update(
        Guid tenantId,
        [FromBody] UpdateTenantRequest request,
        CancellationToken ct)
    {
        var result = await _tenantService.UpdateAsync(tenantId, request, ct);
        return Ok(result);
    }

    [HttpPatch("{tenantId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid tenantId,
        [FromBody] UpdateStatusRequest request,
        CancellationToken ct)
    {
        var result = await _tenantService.UpdateStatusAsync(tenantId, request.Status, ct);
        return Ok(result);
    }
}

public record UpdateStatusRequest(string Status);
