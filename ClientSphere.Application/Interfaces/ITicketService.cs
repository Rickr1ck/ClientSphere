// ClientSphere.Application/Interfaces/ITicketService.cs
using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Tickets;
using ClientSphere.Domain.Entities;

namespace ClientSphere.Application.Interfaces;

public interface ITicketService
{
    Task<PagedResult<TicketResponse>> GetAllAsync(int page, int pageSize, CancellationToken ct = default);
    Task<PagedResult<TicketResponse>> GetByCustomerAsync(Guid customerId, int page, int pageSize, CancellationToken ct = default);
    Task<TicketResponse> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<TicketResponse> CreateAsync(CreateTicketRequest request, (AiSentimentLabel Label, decimal Score)? sentiment, CancellationToken ct = default);
    Task<TicketResponse> UpdateAsync(Guid id, UpdateTicketRequest request, CancellationToken ct = default);
    Task<TicketResponse> UpdateStatusAsync(Guid id, UpdateTicketStatusRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}