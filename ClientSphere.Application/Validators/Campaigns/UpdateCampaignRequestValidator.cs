using System;
using System.Collections.Generic;
using System.Text;

using ClientSphere.Application.DTOs.Campaigns;
using FluentValidation;

namespace ClientSphere.Application.Validators.Campaigns;

public sealed class UpdateCampaignRequestValidator : AbstractValidator<UpdateCampaignRequest>
{
    public UpdateCampaignRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Status).IsInEnum();

        RuleFor(x => x.Channel)
            .MaximumLength(100)
            .When(x => x.Channel is not null);

        RuleFor(x => x.Budget)
            .GreaterThanOrEqualTo(0)
            .When(x => x.Budget.HasValue);

        RuleFor(x => x.ActualSpend)
            .GreaterThanOrEqualTo(0);

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate!.Value)
            .WithMessage("EndDate must be on or after StartDate.")
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue);
    }
}
