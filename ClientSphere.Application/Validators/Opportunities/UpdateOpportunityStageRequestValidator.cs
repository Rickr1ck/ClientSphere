using ClientSphere.Application.DTOs.Opportunities;
using FluentValidation;

namespace ClientSphere.Application.Validators.Opportunities;

public sealed class UpdateOpportunityStageRequestValidator
    : AbstractValidator<UpdateOpportunityStageRequest>
{
    public UpdateOpportunityStageRequestValidator()
    {
        RuleFor(x => x.Stage).IsInEnum();
    }
}