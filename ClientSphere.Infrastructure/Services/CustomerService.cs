using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Customers;
using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ClientSphere.Infrastructure.Services;

public sealed class CustomerService : ICustomerService
{
    private readonly ApplicationDbContext _db;
    private readonly ITenantService _tenantService;
    private readonly ILogger<CustomerService> _logger;

    public CustomerService(
        ApplicationDbContext db,
        ITenantService tenantService,
        ILogger<CustomerService> logger)
    {
        _db = db;
        _tenantService = tenantService;
        _logger = logger;
    }

    public async Task<PagedResult<CustomerResponse>> GetAsync(
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId()
            ?? throw new UnauthorizedAccessException("Tenant context is missing.");
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 25 : Math.Min(pageSize, 200);

        var query = _db.Customers
            .AsNoTracking()
            .Where(c => c.TenantId == tenantId)
            .OrderBy(c => c.CompanyName);

        var total = await query.CountAsync(ct);
        var customers = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = customers.Select(ToResponse).ToList();
        return new PagedResult<CustomerResponse>(items, total, page, pageSize);
    }

    public async Task<CustomerResponse> GetByIdAsync(
        Guid customerId,
        CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId()
            ?? throw new UnauthorizedAccessException("Tenant context is missing.");
        var customer = await _db.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId && c.TenantId == tenantId, ct);

        if (customer is null)
        {
            throw new KeyNotFoundException($"Customer '{customerId}' not found.");
        }

        return ToResponse(customer);
    }

    public async Task<CustomerResponse> CreateAsync(
        CreateCustomerRequest request,
        CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId()
            ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        if (_tenantService.IsUserInRole("ReadOnly"))
        {
            throw new UnauthorizedAccessException("You do not have permission to create customers.");
        }

        if (request.AccountOwnerId is Guid ownerId)
        {
            var ownerExists = await _db.Users.AnyAsync(
                u => u.Id == ownerId && u.TenantId == tenantId,
                ct);

            if (!ownerExists)
            {
                throw new KeyNotFoundException($"User '{ownerId}' not found in this tenant.");
            }
        }

        var customer = new Customer
        {
            TenantId = tenantId,
            CompanyName = request.CompanyName.Trim(),
            Industry = request.Industry,
            Website = request.Website,
            Phone = request.Phone,
            BillingAddressLine1 = request.BillingAddressLine1,
            BillingAddressLine2 = request.BillingAddressLine2,
            BillingCity = request.BillingCity,
            BillingState = request.BillingState,
            BillingPostalCode = request.BillingPostalCode,
            BillingCountry = request.BillingCountry,
            AnnualRevenue = request.AnnualRevenue,
            EmployeeCount = request.EmployeeCount,
            AccountOwnerId = request.AccountOwnerId,
            Notes = request.Notes
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Created customer {CustomerId} in tenant {TenantId}.", customer.Id, tenantId);
        return ToResponse(customer);
    }

    public async Task<CustomerResponse> UpdateAsync(
        Guid customerId,
        UpdateCustomerRequest request,
        CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId()
            ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        if (_tenantService.IsUserInRole("ReadOnly"))
        {
            throw new UnauthorizedAccessException("You do not have permission to update customers.");
        }

        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Id == customerId && c.TenantId == tenantId, ct);

        if (customer is null)
        {
            throw new KeyNotFoundException($"Customer '{customerId}' not found.");
        }

        if (request.AccountOwnerId is Guid ownerId)
        {
            var ownerExists = await _db.Users.AnyAsync(
                u => u.Id == ownerId && u.TenantId == tenantId,
                ct);

            if (!ownerExists)
            {
                throw new KeyNotFoundException($"User '{ownerId}' not found in this tenant.");
            }
        }

        customer.CompanyName = request.CompanyName.Trim();
        customer.Industry = request.Industry;
        customer.Website = request.Website;
        customer.Phone = request.Phone;
        customer.BillingAddressLine1 = request.BillingAddressLine1;
        customer.BillingAddressLine2 = request.BillingAddressLine2;
        customer.BillingCity = request.BillingCity;
        customer.BillingState = request.BillingState;
        customer.BillingPostalCode = request.BillingPostalCode;
        customer.BillingCountry = request.BillingCountry;
        customer.AnnualRevenue = request.AnnualRevenue;
        customer.EmployeeCount = request.EmployeeCount;
        customer.AccountOwnerId = request.AccountOwnerId;
        customer.Notes = request.Notes;

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Updated customer {CustomerId} in tenant {TenantId}.", customer.Id, tenantId);
        return ToResponse(customer);
    }

    public async Task DeleteAsync(Guid customerId, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId()
            ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        if (!_tenantService.IsUserInRole("TenantAdmin") && 
            !_tenantService.IsUserInRole("SuperAdmin") &&
            !_tenantService.IsUserInRole("CompanyAdmin"))
        {
            throw new UnauthorizedAccessException("You do not have permission to delete customers.");
        }

        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Id == customerId && c.TenantId == tenantId, ct);

        if (customer is null)
        {
            throw new KeyNotFoundException($"Customer '{customerId}' not found.");
        }

        _db.Customers.Remove(customer);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Deleted customer {CustomerId} in tenant {TenantId}.", customer.Id, tenantId);
    }

    private static CustomerResponse ToResponse(Customer c) => new(
        Id: c.Id,
        TenantId: c.TenantId,
        CompanyName: c.CompanyName,
        Industry: c.Industry,
        Website: c.Website,
        Phone: c.Phone,
        BillingAddressLine1: c.BillingAddressLine1,
        BillingAddressLine2: c.BillingAddressLine2,
        BillingCity: c.BillingCity,
        BillingState: c.BillingState,
        BillingPostalCode: c.BillingPostalCode,
        BillingCountry: c.BillingCountry,
        AnnualRevenue: c.AnnualRevenue,
        EmployeeCount: c.EmployeeCount,
        AccountOwnerId: c.AccountOwnerId,
        Notes: c.Notes,
        CreatedAt: c.CreatedAt,
        UpdatedAt: c.UpdatedAt);
}
