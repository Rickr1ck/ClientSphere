// ClientSphere.Infrastructure/Services/TicketService.cs
using AutoMapper;
using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Tickets;
using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ClientSphere.Infrastructure.Services;

public sealed class TicketService : ITicketService
{
    private readonly ApplicationDbContext _db;
    private readonly ITenantService _tenantService;
    private readonly IMapper _mapper;
    private readonly ILogger<TicketService> _logger;

    public TicketService(
        ApplicationDbContext db,
        ITenantService tenantService,
        IMapper mapper,
        ILogger<TicketService> logger)
    {
        _db = db;
        _tenantService = tenantService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<TicketResponse>> GetAllAsync(
        int page, int pageSize, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var query = _db.Tickets.AsNoTracking().Where(t => t.TenantId == tenantId);
        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(t => t.Priority)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<TicketResponse>(
            _mapper.Map<List<TicketResponse>>(items), total, page, pageSize);
    }

    public async Task<PagedResult<TicketResponse>> GetByCustomerAsync(
        Guid customerId, int page, int pageSize, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var query = _db.Tickets
            .AsNoTracking()
            .Where(t => t.CustomerId == customerId && t.TenantId == tenantId);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<TicketResponse>(
            _mapper.Map<List<TicketResponse>>(items), total, page, pageSize);
    }

    public async Task<TicketResponse> GetByIdAsync(
        Guid id, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var ticket = await _db.Tickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Ticket {id} not found.");

        return _mapper.Map<TicketResponse>(ticket);
    }

    public async Task<TicketResponse> CreateAsync(
        CreateTicketRequest request,
        (AiSentimentLabel Label, decimal Score)? sentiment,
        CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");
        Guid userId = _tenantService.GetCurrentUserId() ?? throw new UnauthorizedAccessException("User context is missing.");
        string userRole = _tenantService.GetCurrentUserRole() ?? throw new UnauthorizedAccessException("User role is missing.");

        // STRICT RBAC: TenantAdmin CANNOT create tickets (monitor-only role)
        if (userRole == "TenantAdmin")
        {
            throw new UnauthorizedAccessException("Tenant Admins cannot create tickets. This is a monitor-only role.");
        }

        if (userRole != "SuperAdmin" && userRole != "SupportAgent")
        {
            throw new UnauthorizedAccessException("You do not have permission to create tickets.");
        }

        // FK existence checks — global filter scopes to tenant
        var customerExists = await _db.Customers
            .AnyAsync(c => c.Id == request.CustomerId && c.TenantId == tenantId, ct);
        if (!customerExists)
            throw new KeyNotFoundException(
                $"Customer {request.CustomerId} not found.");

        if (request.ContactId.HasValue)
        {
            var contactId = request.ContactId.Value;
            var contactExists = await _db.Contacts
                .AnyAsync(c => c.Id == contactId && c.TenantId == tenantId, ct);
            if (!contactExists)
                throw new KeyNotFoundException(
                    $"Contact {contactId} not found.");
        }

        var ticket = _mapper.Map<Ticket>(request);
        ticket.TenantId = tenantId;
        ticket.CreatedByUserId = userId; // AUTOMATIC: from JWT
        ticket.TicketNumber = await GenerateTicketNumberAsync(ct);

        // Stamp AI columns:
        // ai_sentiment_label  ai_sentiment_label enum
        // ai_sentiment_score  NUMERIC(4,3)
        // ai_analyzed_at      TIMESTAMPTZ
        if (sentiment.HasValue)
        {
            ticket.AiSentimentLabel = sentiment.Value.Label;
            ticket.AiSentimentScore = sentiment.Value.Score;
            ticket.AiAnalyzedAt = DateTimeOffset.UtcNow;
        }

        _db.Tickets.Add(ticket);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Ticket created. Id: {Id}, Number: {Number}, Sentiment: {Sentiment}, TenantId: {TenantId}",
            ticket.Id, ticket.TicketNumber,
            ticket.AiSentimentLabel?.ToString() ?? "null",
            tenantId);

        return _mapper.Map<TicketResponse>(ticket);
    }

    public async Task<TicketResponse> UpdateAsync(
        Guid id, UpdateTicketRequest request, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");
        string userRole = _tenantService.GetCurrentUserRole() ?? throw new UnauthorizedAccessException("User role is missing.");

        // STRICT RBAC: TenantAdmin CANNOT update tickets (monitor-only role)
        if (userRole == "TenantAdmin")
        {
            throw new UnauthorizedAccessException("Tenant Admins cannot update tickets. This is a monitor-only role.");
        }

        if (userRole != "SuperAdmin" && userRole != "SupportAgent")
        {
            throw new UnauthorizedAccessException("You do not have permission to update tickets.");
        }

        var ticket = await _db.Tickets
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Ticket {id} not found.");

        if (request.ContactId is Guid contactId)
        {
            var contactExists = await _db.Contacts
                .AnyAsync(c => c.Id == contactId && c.TenantId == tenantId, ct);
            if (!contactExists)
                throw new KeyNotFoundException(
                    $"Contact {contactId} not found.");
        }

        _mapper.Map(request, ticket);
        ApplyStatusTransitionSideEffects(ticket);

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Ticket updated. Id: {Id}, TenantId: {TenantId}", id, tenantId);
        return _mapper.Map<TicketResponse>(ticket);
    }

    public async Task<TicketResponse> UpdateStatusAsync(
        Guid id, UpdateTicketStatusRequest request, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");
        string userRole = _tenantService.GetCurrentUserRole() ?? throw new UnauthorizedAccessException("User role is missing.");

        // STRICT RBAC: TenantAdmin CANNOT update ticket status (monitor-only role)
        if (userRole == "TenantAdmin")
        {
            throw new UnauthorizedAccessException("Tenant Admins cannot update ticket status. This is a monitor-only role.");
        }

        if (userRole != "SuperAdmin" && userRole != "SupportAgent")
        {
            throw new UnauthorizedAccessException("You do not have permission to update ticket status.");
        }

        var ticket = await _db.Tickets
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Ticket {id} not found.");

        ticket.Status = request.Status;
        ApplyStatusTransitionSideEffects(ticket);

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Ticket status updated. Id: {Id}, Status: {Status}, TenantId: {TenantId}",
            id, ticket.Status, tenantId);

        return _mapper.Map<TicketResponse>(ticket);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var ticket = await _db.Tickets
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Ticket {id} not found.");

        _db.Tickets.Remove(ticket);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Ticket soft-deleted. Id: {Id}, TenantId: {TenantId}", id, tenantId);
    }

    private static void ApplyStatusTransitionSideEffects(Ticket ticket)
    {
        var now = DateTimeOffset.UtcNow;

        if (ticket.Status is TicketStatus.Resolved or TicketStatus.Closed)
            ticket.ResolvedAt ??= now;
        else
            ticket.ResolvedAt = null;

        if (ticket.Status != TicketStatus.Open && ticket.FirstResponseAt is null)
            ticket.FirstResponseAt = now;
    }

    private async Task<string> GenerateTicketNumberAsync(CancellationToken ct)
    {
        var count = await _db.Tickets
            .IgnoreQueryFilters()
            .CountAsync(ct);

        return $"TKT-{(count + 1):D6}";
    }
}