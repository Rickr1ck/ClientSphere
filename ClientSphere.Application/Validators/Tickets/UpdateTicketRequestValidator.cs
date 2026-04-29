using ClientSphere.Application.DTOs.Tickets;
using FluentValidation;


namespace ClientSphere.Application.Validators.Tickets;


public sealed class UpdateTicketRequestValidator : AbstractValidator<UpdateTicketRequest>
{
    public UpdateTicketRequestValidator()
    {
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Priority).IsInEnum();
        RuleFor(x => x.Status).IsInEnum();
    }
}