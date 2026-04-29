// ClientSphere.API/Controllers/LeadsController.cs
using ClientSphere.Application.DTOs.Leads;
using ClientSphere.Application.Interfaces;
using ClientSphere.API.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClientSphere.API.Controllers;

[ApiController]
[Route("api/v1/leads")]
[Authorize]
public sealed class LeadsController : ControllerBase
{
    private readonly ILeadService _service;
    private readonly IValidator<CreateLeadRequest> _createValidator;
    private readonly IValidator<UpdateLeadRequest> _updateValidator;
    private readonly IAiLeadScoringService _aiScoring;

    public LeadsController(
        ILeadService service,
        IValidator<CreateLeadRequest> createValidator,
        IValidator<UpdateLeadRequest> updateValidator,
        IAiLeadScoringService aiScoring)
    {
        _service = service;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _aiScoring = aiScoring;
    }

    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        return Ok(await _service.GetAllAsync(page, pageSize, ct));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(LeadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await _service.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,CompanyAdmin,TenantAdmin,SalesManager,SalesRep")]
    [ProducesResponseType(typeof(LeadResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateLeadRequest request,
        CancellationToken ct)
    {
        var validation = await _createValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ValidationProblem(validation.ToValidationProblemDetails());

        // AI scoring runs after validation, before save.
        // ScoreLead is synchronous — ONNX is CPU-bound not I/O-bound.
        // Any exception inside ScoreLead is caught and returns null.
        // null never blocks the save.
        var aiScore = _aiScoring.ScoreLead(
            source: request.Source,
            jobTitle: request.JobTitle,
            companyName: request.CompanyName,
            estimatedValue: request.EstimatedValue);

        var result = await _service.CreateAsync(request, aiScore, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,CompanyAdmin,TenantAdmin,SalesManager,SalesRep")]
    [ProducesResponseType(typeof(LeadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateLeadRequest request,
        CancellationToken ct)
    {
        var validation = await _updateValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ValidationProblem(validation.ToValidationProblemDetails());

        return Ok(await _service.UpdateAsync(id, request, ct));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,CompanyAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return NoContent();
    }
}