using ClientSphere.Domain.Entities;


namespace ClientSphere.Application.DTOs.Tickets;
public sealed record TicketResponse(
    Guid Id,
    Guid TenantId,
    string TicketNumber,
    Guid CustomerId,
    Guid? ContactId,
    string Subject,
    string? Description,
    TicketPriority Priority,
    TicketStatus Status,
    AiSentimentLabel? AiSentimentLabel,
    decimal? AiSentimentScore,
    Guid? AssignedToId,
    DateTimeOffset? ResolvedAt,
    DateTimeOffset? FirstResponseAt,
    DateTimeOffset? DueAt,
    string[]? Tags,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
