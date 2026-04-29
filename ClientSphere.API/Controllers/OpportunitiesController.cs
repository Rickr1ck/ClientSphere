using ClientSphere.API.Extensions;
using ClientSphere.Application.DTOs.Opportunities;
using ClientSphere.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClientSphere.API.Controllers;

[ApiController]
[Route("api/v1/opportunities")]
[Authorize]
public sealed class OpportunitiesController : ControllerBase
{
    private readonly IOpportunityService _opportunityService;
    private readonly IValidator<CreateOpportunityRequest> _createValidator;
    private readonly IValidator<UpdateOpportunityRequest> _updateValidator;
    private readonly IValidator<UpdateOpportunityStageRequest> _stageValidator;
    private readonly ILogger<OpportunitiesController> _logger;

    public OpportunitiesController(
        IOpportunityService opportunityService,
        IValidator<CreateOpportunityRequest> createValidator,
        IValidator<UpdateOpportunityRequest> updateValidator,
        IValidator<UpdateOpportunityStageRequest> stageValidator,
        ILogger<OpportunitiesController> logger)
    {
        _opportunityService = opportunityService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _stageValidator = stageValidator;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Policy = "SalesRole")]
    public async Task<IActionResult> Get(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        var result = await _opportunityService.GetAsync(page, pageSize, ct);
        return Ok(result);
    }

    [HttpGet("{opportunityId:guid}")]
    [Authorize(Policy = "SalesRole")]
    public async Task<IActionResult> GetById(
        Guid opportunityId,
        CancellationToken ct)
    {
        var result = await _opportunityService.GetByIdAsync(opportunityId, ct);
        return Ok(result);
    }

    [HttpGet("by-customer/{customerId:guid}")]
    [Authorize(Policy = "SalesRole")]
    public async Task<IActionResult> GetByCustomer(
        Guid customerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        var result = await _opportunityService.GetByCustomerAsync(customerId, page, pageSize, ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "SalesRole")]
    public async Task<IActionResult> Create(
        [FromBody] CreateOpportunityRequest request,
        CancellationToken ct)
    {
        var validation = await _createValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            _logger.LogWarning("Create opportunity validation failed.");
            return ValidationProblem(validation.ToValidationProblemDetails());
        }

        var created = await _opportunityService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { opportunityId = created.Id }, created);
    }

    [HttpPut("{opportunityId:guid}")]
    [Authorize(Policy = "SalesRole")]
    public async Task<IActionResult> Update(
        Guid opportunityId,
        [FromBody] UpdateOpportunityRequest request,
        CancellationToken ct)
    {
        var validation = await _updateValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            _logger.LogWarning("Update opportunity validation failed for {OpportunityId}.", opportunityId);
            return ValidationProblem(validation.ToValidationProblemDetails());
        }

        var updated = await _opportunityService.UpdateAsync(opportunityId, request, ct);
        return Ok(updated);
    }

    [HttpPatch("{opportunityId:guid}/stage")]
    [Authorize(Policy = "SalesRole")]
    public async Task<IActionResult> UpdateStage(
        Guid opportunityId,
        [FromBody] UpdateOpportunityStageRequest request,
        CancellationToken ct)
    {
        var validation = await _stageValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            _logger.LogWarning("Update opportunity stage validation failed for {OpportunityId}.", opportunityId);
            return ValidationProblem(validation.ToValidationProblemDetails());
        }

        var updated = await _opportunityService.UpdateStageAsync(opportunityId, request, ct);
        return Ok(updated);
    }

    [HttpDelete("{opportunityId:guid}")]
    [Authorize(Roles = "TenantAdmin")]
    public async Task<IActionResult> Delete(
        Guid opportunityId,
        CancellationToken ct)
    {
        await _opportunityService.DeleteAsync(opportunityId, ct);
        return NoContent();
    }
}
