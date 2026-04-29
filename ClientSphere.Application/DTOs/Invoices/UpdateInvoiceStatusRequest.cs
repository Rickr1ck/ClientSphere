using ClientSphere.Domain.Entities;

namespace ClientSphere.Application.DTOs.Invoices;

public sealed record UpdateInvoiceStatusRequest(
    InvoiceStatus Status,
    DateTimeOffset? PaidAt = null);
