using ClientSphere.Application.DTOs.Contacts;
using FluentValidation;

namespace ClientSphere.Application.Validators.Contacts;

public sealed class UpdateContactRequestValidator : AbstractValidator<UpdateContactRequest>
{
    public UpdateContactRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email)
            .EmailAddress().MaximumLength(320)
            .When(x => x.Email is not null);
        RuleFor(x => x.Phone).MaximumLength(50);
        RuleFor(x => x.JobTitle).MaximumLength(150);
        RuleFor(x => x.Department).MaximumLength(100);
        RuleFor(x => x.LinkedInUrl)
            .MaximumLength(500)
            .Must(v => v is null || Uri.TryCreate(v, UriKind.Absolute, out _))
            .WithMessage("LinkedInUrl must be a valid URL.")
            .When(x => x.LinkedInUrl is not null);
    }
}