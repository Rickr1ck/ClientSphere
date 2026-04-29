using System;
using System.Collections.Generic;
using System.Text;

using ClientSphere.Domain.Entities;

namespace ClientSphere.Application.DTOs.Invoices;

public sealed record InvoiceResponse(
    Guid Id,
    Guid TenantId,
    string InvoiceNumber,
    Guid CustomerId,
    Guid? OpportunityId,
    InvoiceStatus Status,
    DateOnly IssueDate,
    DateOnly DueDate,
    DateTimeOffset? PaidAt,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal TaxRate,
    decimal TaxAmount,
    decimal TotalAmount,
    string CurrencyCode,
    string? StripeInvoiceId,
    string? StripePaymentIntent,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
