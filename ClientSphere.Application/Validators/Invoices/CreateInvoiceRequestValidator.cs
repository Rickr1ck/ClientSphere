using ClientSphere.Application.DTOs.Invoices;
using FluentValidation;


namespace ClientSphere.Application.Validators.Invoices;
public sealed class CreateInvoiceRequestValidator : AbstractValidator<CreateInvoiceRequest>
{
    public CreateInvoiceRequestValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.IssueDate).NotEmpty();
        RuleFor(x => x.DueDate)
            .GreaterThanOrEqualTo(x => x.IssueDate)
            .WithMessage("DueDate must be on or after IssueDate.");
        RuleFor(x => x.Subtotal).GreaterThanOrEqualTo(0);
        RuleFor(x => x.DiscountAmount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TaxRate)
            .InclusiveBetween(0, 1)
            .WithMessage("TaxRate must be between 0 and 1 (e.g. 0.0850 for 8.5%).");
        RuleFor(x => x.CurrencyCode)
            .NotEmpty().Length(3)
            .WithMessage("CurrencyCode must be a 3-character ISO 4217 code.");
    }
}