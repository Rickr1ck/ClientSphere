using ClientSphere.Application.DTOs.Leads;
using FluentValidation;


namespace ClientSphere.Application.Validators.Leads;
public sealed class UpdateLeadRequestValidator : AbstractValidator<UpdateLeadRequest>
{
    public UpdateLeadRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email)
            .EmailAddress().MaximumLength(320)
            .When(x => x.Email is not null);
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.EstimatedValue)
            .GreaterThanOrEqualTo(0)
            .When(x => x.EstimatedValue.HasValue);
    }
}