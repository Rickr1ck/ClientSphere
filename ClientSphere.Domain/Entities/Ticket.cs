using ClientSphere.Domain.Common;

namespace ClientSphere.Domain.Entities;

public enum TicketPriority
{
    Low,
    Medium,
    High,
    Critical
}

public enum TicketStatus
{
    Open,
    Pending,
    InProgress,
    Resolved,
    Closed
}

public enum AiSentimentLabel
{
    Positive,
    Neutral,
    Negative,
    Urgent
}

public sealed class Ticket : AuditableTenantEntity
{
    public string TicketNumber { get; set; } = default!;
    public Guid CustomerId { get; set; }
    public Guid? ContactId { get; set; }
    public string Subject { get; set; } = default!;
    public string? Description { get; set; }

    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public TicketStatus Status { get; set; } = TicketStatus.Open;

    public AiSentimentLabel? AiSentimentLabel { get; set; }

    // numeric(4,3) in Postgres, enforced by DB check constraint (-1..1)
    public decimal? AiSentimentScore { get; set; }

    public DateTimeOffset? AiAnalyzedAt { get; set; }

    public Guid? AssignedToId { get; set; }

    // Ownership tracking - automatically set from JWT on creation
    public Guid CreatedByUserId { get; set; }

    public DateTimeOffset? ResolvedAt { get; set; }

    public DateTimeOffset? FirstResponseAt { get; set; }

    public DateTimeOffset? DueAt { get; set; }

    public string[]? Tags { get; set; }

    // Navigation properties
    public Customer Customer { get; set; } = default!;
    public Contact? Contact { get; set; }
    public User? AssignedTo { get; set; }
    public User CreatedByUser { get; set; } = default!;
}
