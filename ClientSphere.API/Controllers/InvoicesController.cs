using ClientSphere.Application.DTOs.Invoices;
using ClientSphere.API.Extensions;
using ClientSphere.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClientSphere.API.Controllers;
[ApiController]
[Route("api/v1/invoices")]
[Authorize]
public sealed class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _service;
    private readonly IValidator<CreateInvoiceRequest> _createValidator;
    private readonly IValidator<GenerateInvoiceFromOpportunityRequest> _generateValidator;

    public InvoicesController(
        IInvoiceService service,
        IValidator<CreateInvoiceRequest> createValidator,
        IValidator<GenerateInvoiceFromOpportunityRequest> generateValidator)
    {
        _service = service;
        _createValidator = createValidator;
        _generateValidator = generateValidator;
    }

    [HttpGet]
    [Authorize(Roles = "TenantAdmin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        return Ok(await _service.GetAllAsync(page, pageSize, ct));
    }

    [HttpGet("by-customer/{customerId:guid}")]
    [Authorize(Roles = "TenantAdmin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByCustomer(
        Guid customerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        return Ok(await _service.GetByCustomerAsync(customerId, page, pageSize, ct));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "TenantAdmin")]
    [ProducesResponseType(typeof(InvoiceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await _service.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = "TenantAdmin")]
    [ProducesResponseType(typeof(InvoiceResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateInvoiceRequest request,
        CancellationToken ct)
    {
        var validation = await _createValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ValidationProblem(validation.ToValidationProblemDetails());

        var result = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPost("generate-from-opportunity/{opportunityId:guid}")]
    [Authorize(Roles = "TenantAdmin")]
    [ProducesResponseType(typeof(InvoiceResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GenerateFromOpportunity(
        Guid opportunityId,
        [FromBody] GenerateInvoiceFromOpportunityRequest request,
        CancellationToken ct)
    {
        var validation = await _generateValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ValidationProblem(validation.ToValidationProblemDetails());

        var result = await _service.GenerateFromOpportunityAsync(
            opportunityId, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "TenantAdmin")]
    [ProducesResponseType(typeof(InvoiceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateInvoiceStatusRequest request,
        CancellationToken ct)
    {
        var result = await _service.UpdateStatusAsync(id, request, ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "TenantAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return NoContent();
    }
}
