using ClientSphere.Domain.Entities;

namespace ClientSphere.Application.DTOs.Tenants;

public sealed record UpdateTenantRequest(
    TenantStatus Status,
    SubscriptionTier SubscriptionTier,
    short MaxUsers,
    DateTimeOffset? SubscriptionEndsAt);
