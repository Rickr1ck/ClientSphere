using ClientSphere.Domain.Common;

namespace ClientSphere.Domain.Entities;

public enum LeadStatus
{
    New,
    Contacted,
    Qualified,
    Unqualified,
    Nurturing
}

public sealed class Lead : AuditableTenantEntity
{
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;

    public string? Email { get; set; }
    public string? Phone { get; set; }

    public string? CompanyName { get; set; }

    public string? JobTitle { get; set; }
    public string? Source { get; set; }

    public LeadStatus Status { get; set; } = LeadStatus.New;

    public short? AiConversionScore { get; set; } // Smallint 0-100

    public DateTimeOffset? AiScoreCalculatedAt { get; set; }
   
    public decimal? EstimatedValue { get; set; } // NUMERIC [18,2]

    public Guid? AssignedToId { get; set; }

    public DateTimeOffset? ConvertedAt { get; set; }

    public Guid? ConvertedCustomerId { get; set; }

    public string? Notes { get; set; }


    // Navigation properties POYA

    public User? AssignedTo { get; set; }   

    public Customer? ConvertedCustomer { get; set; }

    public string FullName => $"{FirstName} {LastName}";
}
