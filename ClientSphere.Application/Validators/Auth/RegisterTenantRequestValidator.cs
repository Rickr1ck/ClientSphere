using FluentValidation;
using ClientSphere.Application.DTOs.Auth;

namespace ClientSphere.Application.Validators.Auth;

public sealed class RegisterTenantRequestValidator : AbstractValidator<RegisterTenantRequest>
{
    public RegisterTenantRequestValidator()
    {
        RuleFor(x => x.TenantName)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(x => x.TenantSlug)
            .NotEmpty()
            .MaximumLength(100)
            .Matches("^[a-z0-9-]+$")
            .WithMessage("Slug may only contain lowercase letters, numbers, and hyphens.");

        RuleFor(x => x.AdminFirstName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.AdminLastName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.AdminEmail)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(320);

        RuleFor(x => x.AdminPassword)
            .NotEmpty()
            .MinimumLength(12)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one digit.")
            .Matches("[\\W_]").WithMessage("Password must contain at least one special character.");
    }
}
