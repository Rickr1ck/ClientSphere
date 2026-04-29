using ClientSphere.Application.DTOs.Auth;
using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Stripe;
using Stripe.Checkout;
using System.Security.Claims;

namespace ClientSphere.API.Controllers;

[ApiController]
[Route("api/v1/billing")]
[Authorize]
public sealed class BillingController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _config;
    private readonly ITenantService _tenantService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<BillingController> _logger;

    public BillingController(
        ApplicationDbContext db,
        IConfiguration config,
        ITenantService tenantService,
        IMemoryCache cache,
        ILogger<BillingController> logger)
    {
        _db = db;
        _config = config;
        _tenantService = tenantService;
        _cache = cache;
        _logger = logger;
    }

    [HttpPost("checkout")]
    [AllowAnonymous] // Allow pre-registration checkout without auth
    public async Task<IActionResult> CreateCheckoutSession(
        [FromBody] CheckoutRequest? request = null,
        [FromQuery] string? preRegToken = null,
        CancellationToken ct = default)
    {
        string? customerEmail = null;
        Guid? tenantId = null;
        string? planId = null;
        Dictionary<string, string> metadata = new();

        // Check if this is a pre-registration flow
        if (!string.IsNullOrWhiteSpace(preRegToken))
        {
            if (!_cache.TryGetValue(preRegToken, out RegisterWithPlanRequest? preRegData))
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Invalid or Expired Token",
                    Detail = "The registration session has expired. Please start over."
                });
            }

            planId = preRegData!.PlanId;
            customerEmail = preRegData.AdminEmail;
            metadata["preRegToken"] = preRegToken;
            metadata["tenantName"] = preRegData.TenantName;
            metadata["tenantSlug"] = preRegData.TenantSlug;
            metadata["adminFirstName"] = preRegData.AdminFirstName;
            metadata["adminLastName"] = preRegData.AdminLastName;
            metadata["adminEmail"] = preRegData.AdminEmail;
            metadata["planId"] = preRegData.PlanId;
        }
        else
        {
            // Existing tenant flow (requires auth)
            tenantId = _tenantService.GetCurrentTenantId();
            if (tenantId == null || tenantId == Guid.Empty)
            {
                return Unauthorized();
            }

            var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId, ct);
            if (tenant == null)
            {
                return NotFound("Tenant not found");
            }

            customerEmail = User.FindFirstValue(ClaimTypes.Email);
            metadata["tenantId"] = tenantId.ToString();
            planId = request?.PlanId ?? "starter"; // Default to starter plan
        }

        _logger.LogInformation("Creating Stripe checkout session for plan {PlanId}.", planId);

        // Map plan IDs to Stripe Price IDs
        // IMPORTANT: Replace these placeholder Price IDs with your actual Stripe Price IDs from Stripe Dashboard
        // Go to: Stripe Dashboard → Products → Click on each product → Copy the Price ID
        // 
        // MODE MATCHING REQUIRED:
        // - If using sk_test_... keys → Use test mode prices (price_1TR... or price_test_...)
        // - If using sk_live_... keys → Use live mode prices (price_prod_...)
        // - You CANNOT mix test keys with live prices or vice versa!
        //
        // HOW TO CHECK: Look at top of Stripe Dashboard - is "Test Mode" toggle ON or OFF?
        // - Test Mode ON = use test prices
        // - Test Mode OFF = use live/prod prices
        var priceIdMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "free", "price_placeholder_free" },           // TODO: Replace with actual Stripe Price ID
            { "starter", "price_prod_UQ2WAlozxGT5mb" },     // LIVE MODE price (requires sk_live_... key)
            { "professional", "price_prod_UQ2XNjJu9lJKEX" }, // LIVE MODE price (requires sk_live_... key)
            { "enterprise", "price_prod_UQ2XydgdmQWjm7" }   // LIVE MODE price (requires sk_live_... key)
        };

        var priceId = priceIdMap.TryGetValue(planId ?? "starter", out var pid) 
            ? pid 
            : priceIdMap["starter"];

        var domain = _config["App:BaseUrl"] ?? "http://localhost:5173";

        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    Price = priceId,
                    Quantity = 1,
                },
            },
            Mode = "subscription",
            SuccessUrl = domain + "/stripe-success?session_id={CHECKOUT_SESSION_ID}",
            CancelUrl = domain + "/register?canceled=true",
            Metadata = metadata,
            CustomerEmail = customerEmail,
            SubscriptionData = new SessionSubscriptionDataOptions
            {
                Metadata = metadata
            }
        };

        var service = new SessionService();
        Session session = await service.CreateAsync(options, cancellationToken: ct);

        return Ok(new { url = session.Url, sessionId = session.Id });
    }
}

public record CheckoutRequest(string? PlanId = null);
