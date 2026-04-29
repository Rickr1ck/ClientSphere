using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.DTOs.Customers;

public sealed record CustomerResponse(
    Guid Id,
    Guid TenantId,
    string CompanyName,
    string? Industry,
    string? Website,
    string? Phone,
    string? BillingAddressLine1,
    string? BillingAddressLine2,
    string? BillingCity,
    string? BillingState,
    string? BillingPostalCode,
    string? BillingCountry,
    decimal? AnnualRevenue,
    int? EmployeeCount,
    Guid? AccountOwnerId,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);