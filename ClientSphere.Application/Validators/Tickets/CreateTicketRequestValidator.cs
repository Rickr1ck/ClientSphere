using System;
using System.Collections.Generic;
using System.Text;

using ClientSphere.Application.DTOs.Tickets;
using FluentValidation;

namespace ClientSphere.Application.Validators.Tickets;

public sealed class CreateTicketRequestValidator : AbstractValidator<CreateTicketRequest>
{
    public CreateTicketRequestValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Priority).IsInEnum();

        RuleFor(x => x.Description)
            .MaximumLength(4000)
            .When(x => x.Description is not null);
    }
}
