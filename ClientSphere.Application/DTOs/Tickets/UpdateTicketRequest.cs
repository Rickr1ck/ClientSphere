using ClientSphere.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.DTOs.Tickets;

public sealed record UpdateTicketRequest(
    string Subject,
    string? Description,
    TicketPriority Priority,
    TicketStatus Status,
    Guid? AssignedToId,
    Guid? ContactId,
    DateTimeOffset? DueAt,
    string[]? Tags
);
