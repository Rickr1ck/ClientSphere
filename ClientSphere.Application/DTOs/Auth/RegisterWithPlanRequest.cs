namespace ClientSphere.Application.DTOs.Auth;

public sealed record RegisterWithPlanRequest(
    string TenantName,
    string TenantSlug,
    string AdminFirstName,
    string AdminLastName,
    string AdminEmail,
    string AdminPassword,
    string PlanId
);
