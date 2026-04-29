using ClientSphere.Domain.Entities;

namespace ClientSphere.Application.DTOs.Tickets;
// Dedicated status-transition PATCH DTO
public sealed record UpdateTicketStatusRequest(
    TicketStatus Status
);