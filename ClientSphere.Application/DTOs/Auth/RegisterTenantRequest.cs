namespace ClientSphere.Application.DTOs.Auth;

public sealed record RegisterTenantRequest(
    string TenantName,
    string TenantSlug,
    string AdminFirstName,
    string AdminLastName,
    string AdminEmail,
    string AdminPassword
);
