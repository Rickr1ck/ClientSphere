using ClientSphere.Domain.Common;

namespace ClientSphere.Domain.Entities;

public enum SubscriptionTier
{
    Free,
    Starter,
    Professional,
    Enterprise
}

public enum TenantStatus
{
    PendingPayment,
    Active,
    Disabled,
    Trialing
}

public sealed class Tenant : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public TenantStatus Status { get; set; } = TenantStatus.PendingPayment;
    public SubscriptionTier SubscriptionTier { get; set; } = SubscriptionTier.Free;
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
    public DateTimeOffset? TrialEndsAt { get; set; }
    public DateTimeOffset? SubscriptionEndsAt { get; set; }
    public short MaxUsers { get; set; } = 5;

    public ICollection<User> Users { get; set; } = new List<User>();
}
