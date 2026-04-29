using ClientSphere.Application.DTOs.Tickets;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.Validators.Tickets;
public sealed class UpdateTicketStatusRequestValidator
    : AbstractValidator<UpdateTicketStatusRequest>
{
    public UpdateTicketStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
    }
}