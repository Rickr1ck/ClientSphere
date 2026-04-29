using ClientSphere.Domain.Entities;


namespace ClientSphere.Application.DTOs.Leads;
public sealed record LeadResponse(
    Guid Id,
    Guid TenantId,
    string FirstName,
    string LastName,
    string? Email,
    string? Phone,
    string? CompanyName,
    string? JobTitle,
    string? Source,
    LeadStatus Status,
    int? AiConversionScore,
    DateTimeOffset? AiScoreCalculatedAt,
    decimal? EstimatedValue,
    Guid? AssignedToId,
    DateTimeOffset? ConvertedAt,
    Guid? ConvertedCustomerId,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);
