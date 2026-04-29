// ClientSphere.Infrastructure/Services/LeadService.cs
using AutoMapper;
using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Leads;
using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ClientSphere.Infrastructure.Services;

public sealed class LeadService : ILeadService
{
    private readonly ApplicationDbContext _db;
    private readonly ITenantService _tenantService;
    private readonly IMapper _mapper;
    private readonly ILogger<LeadService> _logger;

    public LeadService(
        ApplicationDbContext db,
        ITenantService tenantService,
        IMapper mapper,
        ILogger<LeadService> logger)
    {
        _db = db;
        _tenantService = tenantService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<LeadResponse>> GetAllAsync(
        int page, int pageSize, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var query = _db.Leads.AsNoTracking().Where(l => l.TenantId == tenantId);
        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(l => l.AiConversionScore)
            .ThenByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<LeadResponse>(
            _mapper.Map<List<LeadResponse>>(items), total, page, pageSize);
    }

    public async Task<LeadResponse> GetByIdAsync(
        Guid id, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var lead = await _db.Leads
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Lead {id} not found.");

        return _mapper.Map<LeadResponse>(lead);
    }

    public async Task<LeadResponse> CreateAsync(
        CreateLeadRequest request,
        int? aiConversionScore,
        CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        if (!_tenantService.IsUserInRole("TenantAdmin") && 
            !_tenantService.IsUserInRole("SalesManager") && 
            !_tenantService.IsUserInRole("SalesRep") &&
            !_tenantService.IsUserInRole("CompanyAdmin"))
        {
            throw new UnauthorizedAccessException("You do not have permission to create leads.");
        }

        if (request.AssignedToId is Guid assignedToId)
        {
            var userExists = await _db.Users.AnyAsync(
                u => u.Id == assignedToId && u.TenantId == tenantId,
                ct);

            if (!userExists)
            {
                throw new KeyNotFoundException($"User '{assignedToId}' not found in this tenant.");
            }
        }

        var lead = _mapper.Map<Lead>(request);
        lead.TenantId = tenantId;

        // Stamp AI columns — ai_conversion_score SMALLINT, ai_score_calculated_at TIMESTAMPTZ
        if (aiConversionScore is int score)
        {
            lead.AiConversionScore = (short?)score;
            lead.AiScoreCalculatedAt = DateTimeOffset.UtcNow;
        }

        _db.Leads.Add(lead);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Lead created. Id: {Id}, AiScore: {Score}, TenantId: {TenantId}",
            lead.Id, lead.AiConversionScore?.ToString() ?? "null", tenantId);

        return _mapper.Map<LeadResponse>(lead);
    }

    public async Task<LeadResponse> UpdateAsync(
        Guid id, UpdateLeadRequest request, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var lead = await _db.Leads
            .FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Lead {id} not found.");

        if (request.AssignedToId is Guid assignedToId)
        {
            var userExists = await _db.Users.AnyAsync(
                u => u.Id == assignedToId && u.TenantId == tenantId,
                ct);

            if (!userExists)
            {
                throw new KeyNotFoundException($"User '{assignedToId}' not found in this tenant.");
            }
        }

        _mapper.Map(request, lead);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Lead updated. Id: {Id}, TenantId: {TenantId}", id, tenantId);
        return _mapper.Map<LeadResponse>(lead);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var lead = await _db.Leads
            .FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Lead {id} not found.");

        lead.IsDeleted = true;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Lead soft-deleted. Id: {Id}, TenantId: {TenantId}", id, tenantId);
    }
}