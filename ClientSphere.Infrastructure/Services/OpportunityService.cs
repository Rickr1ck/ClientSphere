using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Opportunities;
using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ClientSphere.Infrastructure.Services;

public sealed class OpportunityService : IOpportunityService
{
    private readonly ApplicationDbContext _db;
    private readonly ITenantService _tenantService;
    private readonly ILogger<OpportunityService> _logger;

    public OpportunityService(
        ApplicationDbContext db,
        ITenantService tenantService,
        ILogger<OpportunityService> logger)
    {
        _db = db;
        _tenantService = tenantService;
        _logger = logger;
    }

    public async Task<PagedResult<OpportunityResponse>> GetAsync(
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 25 : Math.Min(pageSize, 200);

        var query = _db.Opportunities
            .AsNoTracking()
            .Where(o => o.TenantId == tenantId)
            .OrderByDescending(o => o.CreatedAt);

        var total = await query.CountAsync(ct);
        var opportunities = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = opportunities.Select(ToResponse).ToList();
        return new PagedResult<OpportunityResponse>(items, total, page, pageSize);
    }

    public async Task<OpportunityResponse> GetByIdAsync(Guid opportunityId, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");
        var opportunity = await _db.Opportunities
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == opportunityId && o.TenantId == tenantId, ct);

        if (opportunity is null)
        {
            throw new KeyNotFoundException($"Opportunity '{opportunityId}' not found.");
        }

        return ToResponse(opportunity);
    }

    public async Task<PagedResult<OpportunityResponse>> GetByCustomerAsync(
        Guid customerId,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 25 : Math.Min(pageSize, 200);

        var query = _db.Opportunities
            .AsNoTracking()
            .Where(o => o.CustomerId == customerId && o.TenantId == tenantId)
            .OrderByDescending(o => o.CreatedAt);

        var total = await query.CountAsync(ct);
        var opportunities = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = opportunities.Select(ToResponse).ToList();
        return new PagedResult<OpportunityResponse>(items, total, page, pageSize);
    }

    public async Task<OpportunityResponse> CreateAsync(
        CreateOpportunityRequest request,
        CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");
        Guid userId = _tenantService.GetCurrentUserId() ?? throw new UnauthorizedAccessException("User context is missing.");
        string userRole = _tenantService.GetCurrentUserRole() ?? throw new UnauthorizedAccessException("User role is missing.");

        // STRICT RBAC: TenantAdmin CANNOT create opportunities (monitor-only role)
        if (userRole == "TenantAdmin")
        {
            throw new UnauthorizedAccessException("Tenant Admins cannot create opportunities. This is a monitor-only role.");
        }

        if (userRole != "SuperAdmin" && userRole != "SalesManager" && userRole != "SalesRep")
        {
            throw new UnauthorizedAccessException("You do not have permission to create opportunities.");
        }

        var customerExists = await _db.Customers.AnyAsync(c => c.Id == request.CustomerId && c.TenantId == tenantId, ct);
        if (!customerExists)
        {
            throw new KeyNotFoundException($"Customer '{request.CustomerId}' not found in this tenant.");
        }

        if (request.LeadId is Guid leadId)
        {
            var leadExists = await _db.Leads.AnyAsync(l => l.Id == leadId && l.TenantId == tenantId, ct);
            if (!leadExists)
            {
                throw new KeyNotFoundException($"Lead '{leadId}' not found in this tenant.");
            }
        }

        if (request.AssignedToId is Guid assignedToId)
        {
            var userExists = await _db.Users.AnyAsync(u => u.Id == assignedToId && u.TenantId == tenantId, ct);
            if (!userExists)
            {
                throw new KeyNotFoundException($"User '{assignedToId}' not found in this tenant.");
            }
        }

        if (request.PrimaryContactId is Guid contactId)
        {
            var contactExists = await _db.Contacts.AnyAsync(
                c => c.Id == contactId && c.CustomerId == request.CustomerId && c.TenantId == tenantId,
                ct);

            if (!contactExists)
            {
                throw new KeyNotFoundException($"Contact '{contactId}' not found for this customer in this tenant.");
            }
        }

        var opportunity = new Opportunity
        {
            TenantId = tenantId,
            CustomerId = request.CustomerId,
            LeadId = request.LeadId,
            Title = request.Title.Trim(),
            Stage = request.Stage,
            EstimatedValue = request.EstimatedValue,
            Probability = (short?)request.Probability,
            ExpectedCloseDate = request.ExpectedCloseDate,
            // AUTOMATIC OWNERSHIP: Set from JWT token, NOT from request
            OwnerId = userId,
            AssignedToId = request.AssignedToId ?? userId, // Default to owner if not specified
            PrimaryContactId = request.PrimaryContactId,
            Notes = request.Notes
        };

        _db.Opportunities.Add(opportunity);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Created opportunity {OpportunityId} in tenant {TenantId} owned by user {UserId}.", opportunity.Id, tenantId, userId);
        return ToResponse(opportunity);
    }

    public async Task<OpportunityResponse> UpdateAsync(
        Guid opportunityId,
        UpdateOpportunityRequest request,
        CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        if (!_tenantService.IsUserInRole("TenantAdmin") && 
                !_tenantService.IsUserInRole("SalesManager") && 
                !_tenantService.IsUserInRole("SalesRep") && 
                !_tenantService.IsUserInRole("SuperAdmin"))
            {
                throw new UnauthorizedAccessException("You do not have permission to update opportunities.");
            }

        var opportunity = await _db.Opportunities
            .FirstOrDefaultAsync(o => o.Id == opportunityId && o.TenantId == tenantId, ct);

        if (opportunity is null)
        {
            throw new KeyNotFoundException($"Opportunity '{opportunityId}' not found.");
        }

        if (request.AssignedToId is Guid assignedToId)
        {
            var userExists = await _db.Users.AnyAsync(u => u.Id == assignedToId && u.TenantId == tenantId, ct);
            if (!userExists)
            {
                throw new KeyNotFoundException($"User '{assignedToId}' not found in this tenant.");
            }
        }

        if (request.PrimaryContactId is Guid contactId)
        {
            var contactExists = await _db.Contacts.AnyAsync(
                c => c.Id == contactId && c.CustomerId == opportunity.CustomerId && c.TenantId == tenantId,
                ct);

            if (!contactExists)
            {
                throw new KeyNotFoundException($"Contact '{contactId}' not found for this customer in this tenant.");
            }
        }

        opportunity.Title = request.Title.Trim();
        opportunity.Stage = request.Stage;
        opportunity.EstimatedValue = request.EstimatedValue;
        opportunity.Probability = (short?)request.Probability;
        opportunity.ExpectedCloseDate = request.ExpectedCloseDate;
        opportunity.AssignedToId = request.AssignedToId;
        opportunity.PrimaryContactId = request.PrimaryContactId;
        opportunity.LossReason = request.LossReason;
        opportunity.Notes = request.Notes;

        if (request.Stage is OpportunityStage.ClosedWon or OpportunityStage.ClosedLost)
        {
            opportunity.ClosedAt ??= DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Updated opportunity {OpportunityId} in tenant {TenantId}.", opportunity.Id, tenantId);
        return ToResponse(opportunity);
    }

    public async Task<OpportunityResponse> UpdateStageAsync(
        Guid opportunityId,
        UpdateOpportunityStageRequest request,
        CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");
        Guid userId = _tenantService.GetCurrentUserId() ?? throw new UnauthorizedAccessException("User context is missing.");
        string userRole = _tenantService.GetCurrentUserRole() ?? throw new UnauthorizedAccessException("User role is missing.");

        // STRICT RBAC: TenantAdmin cannot modify opportunities
        if (userRole == "TenantAdmin")
        {
            throw new UnauthorizedAccessException("Tenant Admins cannot modify opportunities. This is a monitor-only role.");
        }

        if (userRole != "SuperAdmin" && userRole != "SalesManager" && userRole != "SalesRep")
        {
            throw new UnauthorizedAccessException("You do not have permission to update opportunity stages.");
        }

        var opportunity = await _db.Opportunities
            .FirstOrDefaultAsync(o => o.Id == opportunityId && o.TenantId == tenantId, ct);

        if (opportunity is null)
        {
            throw new KeyNotFoundException($"Opportunity '{opportunityId}' not found.");
        }

        // OWNERSHIP ENFORCEMENT: SalesRep can only update their own opportunities
        // SalesManager and SuperAdmin can update any
        if (userRole == "SalesRep" && opportunity.OwnerId != userId)
        {
            throw new UnauthorizedAccessException("You can only update opportunities that you own.");
        }

        opportunity.Stage = request.Stage;
        
        // Track closure
        if (request.Stage is OpportunityStage.ClosedWon or OpportunityStage.ClosedLost)
        {
            opportunity.ClosedAt = DateTimeOffset.UtcNow;
            opportunity.ClosedByUserId = userId; // Track who closed it
        }
        else
        {
            // If reopened, clear closure tracking
            opportunity.ClosedAt = null;
            opportunity.ClosedByUserId = null;
        }

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Updated opportunity stage for {OpportunityId} to {Stage} in tenant {TenantId} by user {UserId}.",
            opportunity.Id,
            opportunity.Stage,
            tenantId,
            userId);

        return ToResponse(opportunity);
    }

    public async Task DeleteAsync(Guid opportunityId, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        if (!_tenantService.IsUserInRole("TenantAdmin") && 
            !_tenantService.IsUserInRole("SuperAdmin"))
        {
            throw new UnauthorizedAccessException("You do not have permission to delete opportunities.");
        }

        var opportunity = await _db.Opportunities
            .FirstOrDefaultAsync(o => o.Id == opportunityId && o.TenantId == tenantId, ct);

        if (opportunity is null)
        {
            throw new KeyNotFoundException($"Opportunity '{opportunityId}' not found.");
        }

        _db.Opportunities.Remove(opportunity);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Deleted opportunity {OpportunityId} in tenant {TenantId}.", opportunity.Id, tenantId);
    }

    private static OpportunityResponse ToResponse(Opportunity o) => new(
        Id: o.Id,
        TenantId: o.TenantId,
        CustomerId: o.CustomerId,
        LeadId: o.LeadId,
        Title: o.Title,
        Stage: o.Stage,
        EstimatedValue: o.EstimatedValue,
        Probability: o.Probability,
        ExpectedCloseDate: o.ExpectedCloseDate,
        OwnerId: o.OwnerId,
        ClosedByUserId: o.ClosedByUserId,
        ClosedAt: o.ClosedAt,
        AssignedToId: o.AssignedToId,
        PrimaryContactId: o.PrimaryContactId,
        LossReason: o.LossReason,
        Notes: o.Notes,
        CreatedAt: o.CreatedAt,
        UpdatedAt: o.UpdatedAt);
}
