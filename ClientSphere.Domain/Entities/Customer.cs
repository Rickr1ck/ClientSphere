using ClientSphere.Domain.Common;

namespace ClientSphere.Domain.Entities;

public sealed class Customer : AuditableTenantEntity
{
    public string CompanyName { get; set; } = default!;
    public string? Industry { get; set; }
    public string? Website { get; set; }
    public string? Phone { get; set; }

    public string? BillingAddressLine1 { get; set; }
    public string? BillingAddressLine2 { get; set; }

    public string? BillingCity { get; set; }
    public string? BillingState { get; set; }
    public string? BillingPostalCode { get; set; }
    public string? BillingCountry { get; set; } //CHAR [2]
    public decimal? AnnualRevenue { get; set; } //NUMERIC [18,2]

    public int? EmployeeCount { get; set; }

    public Guid? AccountOwnerId { get; set; }

    public string? Notes { get; set; }


    //Navigation properties

    public User? AccountOwner { get; set; }
    public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
    public ICollection<Opportunity> Opportunities { get; set; } = new List<Opportunity>();

    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

}

