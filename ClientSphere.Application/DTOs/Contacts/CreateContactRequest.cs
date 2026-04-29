using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.DTOs.Contacts;

public sealed record CreateContactRequest(

    Guid CustomerId,
    string FirstName,
    string LastName,
    string? Email,
    string? Phone,
    string? JobTitle,
    string? Department,
    bool IsPrimary,
    string? LinkedInUrl,
    Guid? ContactOwnerId,
    string? Notes



);