using ClientSphere.Application.DTOs.Opportunities;
using FluentValidation;


namespace ClientSphere.Application.Validators.Opportunities;
public sealed class UpdateOpportunityRequestValidator
    : AbstractValidator<UpdateOpportunityRequest>
{
    public UpdateOpportunityRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Stage).IsInEnum();
        RuleFor(x => x.EstimatedValue)
            .GreaterThanOrEqualTo(0)
            .When(x => x.EstimatedValue.HasValue);
        RuleFor(x => x.Probability)
            .InclusiveBetween(0, 100)
            .When(x => x.Probability.HasValue);
        RuleFor(x => x.LossReason)
            .MaximumLength(500);
    }
}