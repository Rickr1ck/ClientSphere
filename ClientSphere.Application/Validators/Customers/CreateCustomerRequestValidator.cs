using ClientSphere.Application.DTOs.Customers;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.Validators.Customers;
public sealed class CreateCustomerRequestValidator : AbstractValidator<CreateCustomerRequest>
{
    public CreateCustomerRequestValidator()
    {
        RuleFor(x => x.CompanyName)
            .NotEmpty().MaximumLength(255);

        RuleFor(x => x.Website)
            .MaximumLength(500)
            .Must(v => v is null || Uri.TryCreate(v, UriKind.Absolute, out _))
            .WithMessage("Website must be a valid URL.")
            .When(x => x.Website is not null);

        RuleFor(x => x.Phone)
            .MaximumLength(50);

        RuleFor(x => x.BillingCountry)
            .Length(2)
            .WithMessage("BillingCountry must be an ISO 3166-1 alpha-2 code (e.g. 'US').")
            .When(x => x.BillingCountry is not null);

        RuleFor(x => x.AnnualRevenue)
            .GreaterThanOrEqualTo(0)
            .When(x => x.AnnualRevenue.HasValue);

        RuleFor(x => x.EmployeeCount)
            .GreaterThan(0)
            .When(x => x.EmployeeCount.HasValue);
    }
}
