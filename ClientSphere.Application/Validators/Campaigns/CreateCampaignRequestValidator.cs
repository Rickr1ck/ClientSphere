using ClientSphere.Application.DTOs.Campaigns;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.Validators.Campaigns;

public sealed class CreateCampaignRequestValidator : AbstractValidator<CreateCampaignRequest>
{
    public CreateCampaignRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Budget)
            .GreaterThanOrEqualTo(0)
            .When(x => x.Budget.HasValue);
        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate!.Value)
            .WithMessage("EndDate must be on or after StartDate.")
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue);
    }
}
