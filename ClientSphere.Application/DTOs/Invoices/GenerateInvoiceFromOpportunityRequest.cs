using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.DTOs.Invoices;

public sealed record GenerateInvoiceFromOpportunityRequest(
    DateOnly IssueDate,
    DateOnly DueDate,
    decimal TaxRate,
    string CurrencyCode
);
