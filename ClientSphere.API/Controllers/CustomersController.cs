using ClientSphere.API.Extensions;
using ClientSphere.Application.DTOs.Customers;
using ClientSphere.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClientSphere.API.Controllers;

[ApiController]
[Route("api/v1/customers")]
[Authorize]
public sealed class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;
    private readonly IValidator<CreateCustomerRequest> _createValidator;
    private readonly IValidator<UpdateCustomerRequest> _updateValidator;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(
        ICustomerService customerService,
        IValidator<CreateCustomerRequest> createValidator,
        IValidator<UpdateCustomerRequest> updateValidator,
        ILogger<CustomersController> logger)
    {
        _customerService = customerService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Roles = "TenantAdmin,SalesRep,SupportAgent")]
    public async Task<IActionResult> Get(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        var result = await _customerService.GetAsync(page, pageSize, ct);
        return Ok(result);
    }

    [HttpGet("{customerId:guid}")]
    [Authorize(Roles = "TenantAdmin,SalesRep,SupportAgent")]
    public async Task<IActionResult> GetById(
        Guid customerId,
        CancellationToken ct)
    {
        var result = await _customerService.GetByIdAsync(customerId, ct);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "TenantAdmin,SalesRep,SupportAgent")]
    public async Task<IActionResult> Create(
        [FromBody] CreateCustomerRequest request,
        CancellationToken ct)
    {
        var validation = await _createValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            _logger.LogWarning("Create customer validation failed.");
            return ValidationProblem(validation.ToValidationProblemDetails());
        }

        var created = await _customerService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { customerId = created.Id }, created);
    }

    [HttpPut("{customerId:guid}")]
    [Authorize(Roles = "TenantAdmin,SalesRep,SupportAgent")]
    public async Task<IActionResult> Update(
        Guid customerId,
        [FromBody] UpdateCustomerRequest request,
        CancellationToken ct)
    {
        var validation = await _updateValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            _logger.LogWarning("Update customer validation failed for {CustomerId}.", customerId);
            return ValidationProblem(validation.ToValidationProblemDetails());
        }

        var updated = await _customerService.UpdateAsync(customerId, request, ct);
        return Ok(updated);
    }

    [HttpDelete("{customerId:guid}")]
    [Authorize(Roles = "TenantAdmin")]
    public async Task<IActionResult> Delete(
        Guid customerId,
        CancellationToken ct)
    {
        await _customerService.DeleteAsync(customerId, ct);
        return NoContent();
    }
}
