using AutoMapper;
using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Contacts;
using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ClientSphere.Infrastructure.Services;

public sealed class ContactService : IContactService
{
    private readonly ApplicationDbContext _db;
    private readonly ITenantService _tenantService;
    private readonly IMapper _mapper;
    private readonly ILogger<ContactService> _logger;

    public ContactService(
        ApplicationDbContext db,
        ITenantService tenantService,
        IMapper mapper,
        ILogger<ContactService> logger)
    {
        _db = db;
        _tenantService = tenantService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<ContactResponse>> GetByCustomerAsync(
        Guid customerId,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 25 : Math.Min(pageSize, 200);

        // Global filter handles TenantId + IsDeleted; only filter by customerId and explicitly check TenantId for isolation.
        var query = _db.Contacts
            .AsNoTracking()
            .Where(c => c.CustomerId == customerId && c.TenantId == tenantId)
            .OrderByDescending(c => c.IsPrimary)
            .ThenBy(c => c.LastName);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<ContactResponse>(
            _mapper.Map<List<ContactResponse>>(items),
            total,
            page,
            pageSize);
    }

    public async Task<ContactResponse> GetByIdAsync(Guid contactId, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var contact = await _db.Contacts
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == contactId && c.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Contact {contactId} not found.");

        return _mapper.Map<ContactResponse>(contact);
    }

    public async Task<ContactResponse> CreateAsync(CreateContactRequest request, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        // Verify parent customer exists within this tenant.
        var customerExists = await _db.Customers.AnyAsync(c => c.Id == request.CustomerId && c.TenantId == tenantId, ct);
        if (!customerExists)
        {
            throw new KeyNotFoundException($"Customer {request.CustomerId} not found.");
        }

        // If new contact is primary, demote existing primary contacts.
        if (request.IsPrimary)
        {
            await DemoteExistingPrimaryAsync(request.CustomerId, tenantId, excludeId: null, ct);
        }

        var contact = _mapper.Map<Contact>(request);
        contact.TenantId = tenantId;

        _db.Contacts.Add(contact);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Contact created. Id: {Id}, CustomerId: {CustomerId}, TenantId: {TenantId}",
            contact.Id,
            contact.CustomerId,
            tenantId);

        return _mapper.Map<ContactResponse>(contact);
    }

    public async Task<ContactResponse> UpdateAsync(Guid contactId, UpdateContactRequest request, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var contact = await _db.Contacts
            .FirstOrDefaultAsync(c => c.Id == contactId && c.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Contact {contactId} not found.");

        if (request.IsPrimary && !contact.IsPrimary)
        {
            await DemoteExistingPrimaryAsync(contact.CustomerId, tenantId, excludeId: contactId, ct);
        }

        _mapper.Map(request, contact);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Contact updated. Id: {Id}, TenantId: {TenantId}", contactId, tenantId);
        return _mapper.Map<ContactResponse>(contact);
    }

    public async Task DeleteAsync(Guid contactId, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var contact = await _db.Contacts
            .FirstOrDefaultAsync(c => c.Id == contactId && c.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Contact {contactId} not found.");

        // Soft-delete via AuditableEntityInterceptor.
        _db.Contacts.Remove(contact);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Contact soft-deleted. Id: {Id}, TenantId: {TenantId}", contactId, tenantId);
    }

    // Ensures only one primary contact exists per customer.
    private async Task DemoteExistingPrimaryAsync(Guid customerId, Guid tenantId, Guid? excludeId, CancellationToken ct)
    {
        var existing = await _db.Contacts
            .Where(c =>
                c.CustomerId == customerId &&
                c.TenantId == tenantId &&
                c.IsPrimary &&
                (excludeId == null || c.Id != excludeId))
            .ToListAsync(ct);

        foreach (var c in existing)
        {
            c.IsPrimary = false;
        }
    }
}

