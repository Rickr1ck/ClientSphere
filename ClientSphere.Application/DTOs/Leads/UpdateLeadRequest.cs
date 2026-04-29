using ClientSphere.Domain.Entities;


namespace ClientSphere.Application.DTOs.Leads;

public sealed record UpdateLeadRequest(
    string FirstName,
    string LastName,
    string? Email,
    string? Phone,
    string? CompanyName,
    string? JobTitle,
    string? Source,
    LeadStatus Status,
    decimal? EstimatedValue,
    Guid? AssignedToId,
    string? Notes
);