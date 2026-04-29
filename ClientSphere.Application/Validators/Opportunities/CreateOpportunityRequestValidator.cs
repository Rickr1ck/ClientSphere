using ClientSphere.Application.DTOs.Opportunities;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.Validators.Opportunities;
public sealed class CreateOpportunityRequestValidator
    : AbstractValidator<CreateOpportunityRequest>
{
    public CreateOpportunityRequestValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Stage).IsInEnum();
        RuleFor(x => x.EstimatedValue)
            .GreaterThanOrEqualTo(0)
            .When(x => x.EstimatedValue.HasValue);
        RuleFor(x => x.Probability)
            .InclusiveBetween(0, 100)
            .When(x => x.Probability.HasValue);
        RuleFor(x => x.ExpectedCloseDate)
            .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Expected close date must be today or in the future.")
            .When(x => x.ExpectedCloseDate.HasValue);
    }
}