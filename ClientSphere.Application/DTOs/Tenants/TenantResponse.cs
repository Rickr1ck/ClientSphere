using ClientSphere.Domain.Entities;

namespace ClientSphere.Application.DTOs.Tenants;

public sealed record TenantResponse(
    Guid Id,
    string Name,
    string Slug,
    TenantStatus Status,
    SubscriptionTier SubscriptionTier,
    DateTimeOffset? TrialEndsAt,
    DateTimeOffset? SubscriptionEndsAt,
    short MaxUsers,
    DateTimeOffset CreatedAt);
