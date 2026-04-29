using FluentValidation;
using ClientSphere.Application.DTOs.Auth;

namespace ClientSphere.Application.Validators.Auth;

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(320);

        RuleFor(x => x.Password)
            .NotEmpty();

        RuleFor(x => x.TenantId)
            .NotEmpty()
            .Must(id => id != Guid.Empty)
            .WithMessage("A valid tenant identifier is required.");
    }
}
