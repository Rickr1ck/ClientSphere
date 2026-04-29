// ClientSphere.API/Controllers/TicketsController.cs
using ClientSphere.Application.DTOs.Tickets;
using ClientSphere.Application.Interfaces;
using ClientSphere.API.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClientSphere.API.Controllers;

[ApiController]
[Route("api/v1/tickets")]
[Authorize]
public sealed class TicketsController : ControllerBase
{
    private readonly ITicketService _service;
    private readonly IValidator<CreateTicketRequest> _createValidator;
    private readonly IValidator<UpdateTicketRequest> _updateValidator;
    private readonly IValidator<UpdateTicketStatusRequest> _statusValidator;
    private readonly IAiSentimentService _aiSentiment;

    public TicketsController(
        ITicketService service,
        IValidator<CreateTicketRequest> createValidator,
        IValidator<UpdateTicketRequest> updateValidator,
        IValidator<UpdateTicketStatusRequest> statusValidator,
        IAiSentimentService aiSentiment)
    {
        _service = service;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _statusValidator = statusValidator;
        _aiSentiment = aiSentiment;
    }

    [HttpGet]
    [Authorize(Policy = "SupportRole")]
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
    [Authorize(Policy = "SupportRole")]
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
    [Authorize(Policy = "SupportRole")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await _service.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Policy = "SupportRole")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateTicketRequest request,
        CancellationToken ct)
    {
        var validation = await _createValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ValidationProblem(validation.ToValidationProblemDetails());

        // AI sentiment runs after validation, before save.
        // AnalyseSentiment is synchronous — ONNX is CPU-bound not I/O-bound.
        // Any exception inside AnalyseSentiment is caught and returns null.
        // null never blocks the save.
        var sentiment = _aiSentiment.AnalyseSentiment(
            subject: request.Subject,
            description: request.Description);

        var result = await _service.CreateAsync(request, sentiment, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "SupportRole")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateTicketRequest request,
        CancellationToken ct)
    {
        var validation = await _updateValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ValidationProblem(validation.ToValidationProblemDetails());

        return Ok(await _service.UpdateAsync(id, request, ct));
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "SupportRole")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateTicketStatusRequest request,
        CancellationToken ct)
    {
        var validation = await _statusValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return ValidationProblem(validation.ToValidationProblemDetails());

        return Ok(await _service.UpdateStatusAsync(id, request, ct));
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
