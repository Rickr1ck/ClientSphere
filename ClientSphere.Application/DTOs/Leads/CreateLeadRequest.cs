namespace ClientSphere.Application.DTOs.Leads;
public sealed record CreateLeadRequest(
    string FirstName,
    string LastName,
    string? Email,
    string? Phone,
    string? CompanyName,
    string? JobTitle,
    string? Source,
    string? Notes,
    decimal? EstimatedValue,
    Guid? AssignedToId
);