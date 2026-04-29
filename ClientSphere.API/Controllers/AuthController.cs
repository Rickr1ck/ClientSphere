using ClientSphere.API.Extensions;
using ClientSphere.Application.DTOs.Auth;
using ClientSphere.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace ClientSphere.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
[AllowAnonymous]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IValidator<RegisterTenantRequest> _registerValidator;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly ILogger<AuthController> _logger;
    private readonly IMemoryCache _cache;

    public AuthController(
        IAuthService authService,
        IValidator<RegisterTenantRequest> registerValidator,
        IValidator<LoginRequest> loginValidator,
        ILogger<AuthController> logger,
        IMemoryCache cache)
    {
        _authService = authService;
        _registerValidator = registerValidator;
        _loginValidator = loginValidator;
        _logger = logger;
        _cache = cache;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RegisterTenant(
        [FromBody] RegisterTenantRequest request,
        CancellationToken ct)
    {
        var validation = await _registerValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            _logger.LogWarning(
                "Tenant registration validation failed for slug {TenantSlug}.",
                request.TenantSlug);
            return ValidationProblem(validation.ToValidationProblemDetails());
        }

        var response = await _authService.RegisterTenantAsync(request, ct);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken ct)
    {
        var validation = await _loginValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            _logger.LogWarning(
                "Login validation failed for tenant {TenantId} and email {Email}.",
                request.TenantId,
                request.Email);
            return ValidationProblem(validation.ToValidationProblemDetails());
        }

        var response = await _authService.LoginAsync(request, ct);
        return Ok(response);
    }

    [HttpPost("register-with-plan")]
    [ProducesResponseType(typeof(PreRegistrationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RegisterWithPlan(
        [FromBody] RegisterWithPlanRequest request,
        CancellationToken ct)
    {
        _logger.LogInformation(
            "Pre-registration attempt for tenant {TenantSlug} with plan {PlanId}.",
            request.TenantSlug,
            request.PlanId);

        // Validate email and password format
        if (string.IsNullOrWhiteSpace(request.AdminEmail) || !request.AdminEmail.Contains("@"))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Email",
                Detail = "A valid email address is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.AdminPassword) || request.AdminPassword.Length < 12)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Password",
                Detail = "Password must be at least 12 characters."
            });
        }

        // Check if tenant slug already exists
        var normalizedSlug = request.TenantSlug.Trim().ToLowerInvariant();
        var slugExists = await _authService.IsTenantSlugTakenAsync(normalizedSlug, ct);
        if (slugExists)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Tenant Slug Already In Use",
                Detail = $"The workspace slug '{normalizedSlug}' is already taken."
            });
        }

        // Generate a temporary token to store registration data
        var preRegToken = Guid.NewGuid().ToString();
        var cacheEntryOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(30));

        _cache.Set(preRegToken, request, cacheEntryOptions);

        _logger.LogInformation(
            "Pre-registration data cached with token {PreRegToken} for tenant {TenantSlug}.",
            preRegToken,
            normalizedSlug);

        return Ok(new PreRegistrationResponse(
            PreRegistrationToken: preRegToken,
            CheckoutUrl: $"/api/v1/billing/checkout?preRegToken={preRegToken}"
        ));
    }
}
