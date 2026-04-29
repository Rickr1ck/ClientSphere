using ClientSphere.Application.DTOs.Leads;
using FluentValidation;

namespace ClientSphere.Application.Validators.Leads;
public sealed class CreateLeadRequestValidator : AbstractValidator<CreateLeadRequest>
{
    public CreateLeadRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email)
            .EmailAddress().MaximumLength(320)
            .When(x => x.Email is not null);
        RuleFor(x => x.Phone).MaximumLength(50);
        RuleFor(x => x.CompanyName).MaximumLength(255);
        RuleFor(x => x.JobTitle).MaximumLength(150);
        RuleFor(x => x.Source).MaximumLength(100);
        RuleFor(x => x.EstimatedValue)
            .GreaterThanOrEqualTo(0)
            .When(x => x.EstimatedValue.HasValue);
    }
}
