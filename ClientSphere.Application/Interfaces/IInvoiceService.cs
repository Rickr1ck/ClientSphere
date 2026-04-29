using System;
using System.Collections.Generic;
using System.Text;

using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Invoices;

namespace ClientSphere.Application.Interfaces;

public interface IInvoiceService
{
    Task<PagedResult<InvoiceResponse>> GetAllAsync(
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<PagedResult<InvoiceResponse>> GetByCustomerAsync(
        Guid customerId,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<InvoiceResponse> GetByIdAsync(
        Guid id,
        CancellationToken ct = default);

    Task<InvoiceResponse> CreateAsync(
        CreateInvoiceRequest request,
        CancellationToken ct = default);

    Task<InvoiceResponse> GenerateFromOpportunityAsync(
        Guid opportunityId,
        GenerateInvoiceFromOpportunityRequest request,
        CancellationToken ct = default);

    Task<InvoiceResponse> UpdateStatusAsync(
        Guid id,
        UpdateInvoiceStatusRequest request,
        CancellationToken ct = default);

    Task DeleteAsync(
        Guid id,
        CancellationToken ct = default);
}
