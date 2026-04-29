using ClientSphere.Application.DTOs.Invoices;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.Validators.Invoices;
public sealed class GenerateInvoiceFromOpportunityRequestValidator
    : AbstractValidator<GenerateInvoiceFromOpportunityRequest>
{
    public GenerateInvoiceFromOpportunityRequestValidator()
    {
        RuleFor(x => x.IssueDate).NotEmpty();
        RuleFor(x => x.DueDate)
            .GreaterThanOrEqualTo(x => x.IssueDate)
            .WithMessage("DueDate must be on or after IssueDate.");
        RuleFor(x => x.TaxRate)
            .InclusiveBetween(0, 1)
            .WithMessage("TaxRate must be between 0 and 1.");
        RuleFor(x => x.CurrencyCode)
            .NotEmpty().Length(3)
            .WithMessage("CurrencyCode must be a 3-character ISO 4217 code.");
    }
}