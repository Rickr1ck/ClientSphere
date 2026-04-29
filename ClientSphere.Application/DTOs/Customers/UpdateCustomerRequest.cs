using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.DTOs.Customers;

public sealed record UpdateCustomerRequest(
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
    string? Notes
);