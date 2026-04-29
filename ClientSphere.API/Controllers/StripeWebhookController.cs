using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Stripe;
using System.Text;
using BCrypt.Net;

namespace ClientSphere.API.Controllers;

[ApiController]
[Route("api/v1/webhooks/stripe")]
[AllowAnonymous] // Stripe cannot send a Bearer token — signature verification replaces auth
public sealed class StripeWebhookController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _config;
    private readonly IMemoryCache _cache;
    private readonly ILogger<StripeWebhookController> _logger;

    public StripeWebhookController(
        ApplicationDbContext db,
        IConfiguration config,
        IMemoryCache cache,
        ILogger<StripeWebhookController> logger)
    {
        _db = db;
        _config = config;
        _cache = cache;
        _logger = logger;
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Handle(CancellationToken ct)
    {
        string json;
        using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
            json = await reader.ReadToEndAsync(ct);

        var webhookSecret = _config["Stripe:WebhookSecret"];
        if (string.IsNullOrWhiteSpace(webhookSecret))
        {
            _logger.LogWarning("Stripe webhook called but Stripe:WebhookSecret is not configured.");
            return BadRequest("Stripe webhook is not configured.");
        }

        string stripeSignature = Request.Headers["Stripe-Signature"].ToString();
        
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(json, stripeSignature, webhookSecret);
            
            // Idempotency check: skip already processed events to prevent duplicate tenant creation
            var cacheKey = $"stripe_event_{stripeEvent.Id}";
            if (_cache.TryGetValue(cacheKey, out _))
            {
                _logger.LogInformation("Stripe event {EventId} already processed, skipping.", stripeEvent.Id);
                return Ok();
            }
            
            _logger.LogInformation("Stripe event received: {EventType} (ID: {EventId})", stripeEvent.Type, stripeEvent.Id);

            IActionResult result;
            switch (stripeEvent.Type)
            {
                case "checkout.session.completed":
                    result = await HandleCheckoutSessionCompletedAsync(stripeEvent, ct);
                    break;
                default:
                    result = Ok();
                    break;
            }
            
            // Mark event as processed (cache for 7 days to handle Stripe retries)
            _cache.Set(cacheKey, true, new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromDays(7)));
            
            return result;
        }
        catch (StripeException e)
        {
            _logger.LogWarning(e, "Stripe webhook rejected due to invalid signature or payload.");
            return BadRequest("Invalid signature.");
        }
    }

    private async Task<IActionResult> HandleCheckoutSessionCompletedAsync(Event stripeEvent, CancellationToken ct)
    {
        var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
        if (session == null) return Ok();

        // Check if this is a pre-registration flow
        if (session.Metadata.TryGetValue("preRegToken", out var preRegToken))
        {
            return await HandlePreRegistrationCheckoutAsync(session, ct);
        }

        // Existing tenant subscription upgrade/renewal
        return await HandleExistingTenantCheckoutAsync(session, ct);
    }

    private async Task<IActionResult> HandlePreRegistrationCheckoutAsync(Stripe.Checkout.Session session, CancellationToken ct)
    {
        _logger.LogInformation("Processing pre-registration checkout for session {SessionId}.", session.Id);

        // Extract registration data from metadata
        if (!session.Metadata.TryGetValue("tenantName", out var tenantName) ||
            !session.Metadata.TryGetValue("tenantSlug", out var tenantSlug) ||
            !session.Metadata.TryGetValue("adminFirstName", out var adminFirstName) ||
            !session.Metadata.TryGetValue("adminLastName", out var adminLastName) ||
            !session.Metadata.TryGetValue("adminEmail", out var adminEmail) ||
            !session.Metadata.TryGetValue("planId", out var planId))
        {
            _logger.LogWarning("Pre-registration checkout session missing required metadata.");
            return BadRequest("Missing registration data.");
        }

        // Check if tenant already exists (idempotency)
        var normalizedSlug = tenantSlug.Trim().ToLowerInvariant();
        var existingTenant = await _db.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Slug == normalizedSlug, ct);

        if (existingTenant != null)
        {
            _logger.LogInformation("Tenant {TenantSlug} already exists, skipping creation.", normalizedSlug);
            return Ok();
        }

        // Create tenant and admin user
        var now = DateTimeOffset.UtcNow;
        var tenantId = Guid.NewGuid();
        var adminId = Guid.NewGuid();

        // Map plan ID to subscription tier
        var subscriptionTier = planId.ToLowerInvariant() switch
        {
            "starter" => SubscriptionTier.Starter,
            "professional" => SubscriptionTier.Professional,
            "enterprise" => SubscriptionTier.Enterprise,
            _ => SubscriptionTier.Starter
        };

        var maxUsers = subscriptionTier switch
        {
            SubscriptionTier.Starter => (short)5,
            SubscriptionTier.Professional => (short)25,
            SubscriptionTier.Enterprise => short.MaxValue,
            _ => (short)5
        };

        // IMPORTANT: Password is NOT in metadata - we need to generate a temporary one
        // The admin will be prompted to set their password on first login
        var tempPassword = $"TempPass_{Guid.NewGuid().ToString("N").Substring(0, 12)}!";
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword, workFactor: 12);

        var tenant = new Tenant
        {
            Id = tenantId,
            Name = tenantName.Trim(),
            Slug = normalizedSlug,
            Status = TenantStatus.Active,
            SubscriptionTier = subscriptionTier,
            StripeCustomerId = session.CustomerId,
            StripeSubscriptionId = session.SubscriptionId,
            MaxUsers = maxUsers,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = adminId
        };

        var adminUser = new User
        {
            Id = adminId,
            TenantId = tenantId,
            Email = adminEmail.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            FirstName = adminFirstName.Trim(),
            LastName = adminLastName.Trim(),
            RbacRole = RbacRole.TenantAdmin,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = adminId
        };

        try
        {
            _db.Tenants.Add(tenant);
            _db.Users.Add(adminUser);
            await _db.SaveChangesAsync(ct);

            _logger.LogInformation(
                "Tenant {TenantSlug} created successfully after payment. Admin: {AdminEmail}",
                normalizedSlug,
                adminEmail);

            // Cache the temporary password for 24 hours so admin can retrieve it
            var cacheKey = $"temp_password_{adminEmail}";
            _cache.Set(cacheKey, tempPassword, new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromHours(24)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create tenant {TenantSlug} after payment.", normalizedSlug);
            return StatusCode(500, "Failed to complete registration.");
        }

        return Ok();
    }

    private async Task<IActionResult> HandleExistingTenantCheckoutAsync(Stripe.Checkout.Session session, CancellationToken ct)
    {
        // Extract tenantId from metadata
        if (!session.Metadata.TryGetValue("tenantId", out var tenantIdStr) || 
            !Guid.TryParse(tenantIdStr, out var tenantId))
        {
            _logger.LogWarning("Stripe checkout.session.completed missing or invalid tenantId in metadata.");
            return Ok();
        }

        var tenant = await _db.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct);

        if (tenant == null)
        {
            _logger.LogWarning("Tenant {TenantId} not found during webhook processing.", tenantId);
            return Ok();
        }

        _logger.LogInformation("Updating tenant {TenantId} status to Active after successful payment.", tenantId);
        
        tenant.Status = TenantStatus.Active;
        tenant.StripeCustomerId = session.CustomerId;
        tenant.StripeSubscriptionId = session.SubscriptionId;

        await _db.SaveChangesAsync(ct);

        return Ok();
    }
}