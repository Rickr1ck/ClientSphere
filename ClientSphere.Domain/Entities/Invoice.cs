using ClientSphere.Domain.Common;


namespace ClientSphere.Domain.Entities;

public enum InvoiceStatus
{
    Draft, Sent, Paid, Void, Uncollectible
}

public class Invoice : AuditableTenantEntity
{
    public string InvoiceNumber { get; set; } = default!;
    public Guid CustomerId { get; set; }
    public Guid? OpportunityId { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public DateOnly IssueDate { get; set; }
    public DateOnly DueDate { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxRate { get; set; }   // NUMERIC(5,4) — e.g. 0.0850
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string CurrencyCode { get; set; } = "USD";   // CHAR(3)
    public string? StripeInvoiceId { get; set; }
    public string? StripePaymentIntent { get; set; }
    public string? Notes { get; set; }

    // Navigations
    public Customer Customer { get; set; } = default!;
    public Opportunity? Opportunity { get; set; }
}