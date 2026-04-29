using ClientSphere.Domain.Common;


namespace ClientSphere.Domain.Entities;

public class Contact : AuditableTenantEntity
{
    public Guid CustomerId { get; set; }
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? JobTitle { get; set; }
    public string? Department { get; set; }
    public bool IsPrimary { get; set; } = false;
    public string? LinkedInUrl { get; set; }
    public Guid? ContactOwnerId { get; set; }
    public string? Notes { get; set; }

    // Navigations
    public Customer Customer { get; set; } = default!;
    public User? ContactOwner { get; set; }

    public string FullName => $"{FirstName} {LastName}";

   
}