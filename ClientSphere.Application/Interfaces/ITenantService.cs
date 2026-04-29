namespace ClientSphere.Application.Interfaces;

public interface ITenantService
{
    Guid? GetCurrentTenantId();
    Guid? GetCurrentUserId();
    string? GetCurrentUserRole();
    bool IsUserInRole(string role);
}
