namespace ClientSphere.Application.DTOs.Auth;

public sealed record AuthResponse(
    string AccessToken,
    string TokenType,
    int ExpiresInSeconds,
    Guid UserId,
    Guid TenantId,
    string Email,
    string FullName,
    string Role,
    string TenantStatus,
    bool RequiresPayment = false
);
