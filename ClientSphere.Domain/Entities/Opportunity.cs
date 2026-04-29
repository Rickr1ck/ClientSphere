using ClientSphere.Domain.Common;

namespace ClientSphere.Domain.Entities;
public enum OpportunityStage
{
    Prospecting,
    Qualification,
    Proposal,
    Negotiation,
    ClosedWon,
    ClosedLost
}

public sealed class Opportunity : AuditableTenantEntity
{
    public Guid CustomerId { get; set; }
    public Guid? LeadId { get; set; }
    public string Title { get; set; } =default!;

    public OpportunityStage Stage { get; set; } = OpportunityStage.Prospecting;

    public decimal? EstimatedValue { get; set; } // NUMERIC [18,2]

    public short? Probability { get; set; } // Smallint 0-100

    public DateOnly? ExpectedCloseDate { get; set; }

    // Ownership tracking - automatically set from JWT on creation
    public Guid OwnerId { get; set; }
    
    // Closure tracking - set when opportunity is closed (won/lost)
    public Guid? ClosedByUserId { get; set; }
    public DateTimeOffset? ClosedAt { get; set; }

    public Guid? AssignedToId { get; set; }

    public Guid? PrimaryContactId { get; set; }

    public string? Notes { get; set; }
    public string? LossReason { get; set; }

    // Navigation properties

    public Customer Customer { get; set; } = default!;
    public Lead? Lead { get; set; }

    public User Owner { get; set; } = default!;
    public User? ClosedByUser { get; set; }
    public User? AssignedTo { get; set; }

    public Contact? PrimaryContact { get; set; }
}
