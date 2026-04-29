namespace ClientSphere.Application.DTOs.Auth;

public sealed record PreRegistrationResponse(
    string PreRegistrationToken,
    string CheckoutUrl
);
