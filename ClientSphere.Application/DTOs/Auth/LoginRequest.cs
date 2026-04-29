namespace ClientSphere.Application.DTOs.Auth;

public sealed record LoginRequest(
    string Email,
    string Password,
    Guid TenantId
);
