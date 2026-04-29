using ClientSphere.Domain.Entities;

namespace ClientSphere.Application.DTOs.Tickets;

public sealed record CreateTicketRequest(
    Guid CustomerId,
    Guid? ContactId,
    string Subject,
    string? Description,
    TicketPriority Priority,
    Guid? AssignedToId,
    DateTimeOffset? DueAt,
    string[]? Tags
);
