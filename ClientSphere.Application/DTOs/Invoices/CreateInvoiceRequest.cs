using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.DTOs.Invoices;

public sealed record CreateInvoiceRequest(
    Guid CustomerId,
    Guid? OpportunityId,
    DateOnly IssueDate,
    DateOnly DueDate,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal TaxRate,
    string CurrencyCode,
    string? Notes
);
