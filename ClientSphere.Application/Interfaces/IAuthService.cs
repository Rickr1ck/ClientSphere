using ClientSphere.Application.DTOs.Auth;

namespace ClientSphere.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterTenantAsync(
        RegisterTenantRequest request,
        CancellationToken ct = default);

    Task<AuthResponse> LoginAsync(
        LoginRequest request,
        CancellationToken ct = default);

    Task<bool> IsTenantSlugTakenAsync(
        string slug,
        CancellationToken ct = default);
}
