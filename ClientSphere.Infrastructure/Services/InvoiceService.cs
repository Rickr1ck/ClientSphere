using AutoMapper;
using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Invoices;
using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Infrastructure.Services;
public sealed class InvoiceService : IInvoiceService
{
    private readonly ApplicationDbContext _db;
    private readonly ITenantService _tenantService;
    private readonly IMapper _mapper;
    private readonly ILogger<InvoiceService> _logger;

    public InvoiceService(
        ApplicationDbContext db,
        ITenantService tenantService,
        IMapper mapper,
        ILogger<InvoiceService> logger)
    {
        _db = db;
        _tenantService = tenantService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<InvoiceResponse>> GetAllAsync(
        int page, int pageSize, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var query = _db.Invoices.AsNoTracking().Where(i => i.TenantId == tenantId);
        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(i => i.IssueDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<InvoiceResponse>(
            _mapper.Map<List<InvoiceResponse>>(items), total, page, pageSize);
    }

    public async Task<PagedResult<InvoiceResponse>> GetByCustomerAsync(
        Guid customerId, int page, int pageSize, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var query = _db.Invoices
            .AsNoTracking()
            .Where(i => i.CustomerId == customerId && i.TenantId == tenantId);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(i => i.IssueDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<InvoiceResponse>(
            _mapper.Map<List<InvoiceResponse>>(items), total, page, pageSize);
    }

    public async Task<InvoiceResponse> GetByIdAsync(
        Guid id, CancellationToken ct = default)
    {
        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var invoice = await _db.Invoices.AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Invoice {id} not found.");

        return _mapper.Map<InvoiceResponse>(invoice);
    }

    public async Task<InvoiceResponse> CreateAsync(
        CreateInvoiceRequest request, CancellationToken ct = default)
    {
        if (!_tenantService.IsUserInRole("TenantAdmin") && 
            !_tenantService.IsUserInRole("SuperAdmin") &&
            !_tenantService.IsUserInRole("CompanyAdmin"))
        { 
            throw new UnauthorizedAccessException("You do not have permission to create invoices.");
        }

        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var customerExists = await _db.Customers
            .AnyAsync(c => c.Id == request.CustomerId && c.TenantId == tenantId, ct);
        if (!customerExists)
            throw new KeyNotFoundException(
                $"Customer {request.CustomerId} not found or tenant mismatch.");

        var invoice = _mapper.Map<Invoice>(request);
        invoice.TenantId = tenantId;
        invoice.InvoiceNumber = await GenerateInvoiceNumberAsync(ct);
        CalculateTotals(invoice);

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Invoice created for Tenant {TenantId}. Id: {Id}, Number: {Number}",
            tenantId, invoice.Id, invoice.InvoiceNumber);

        return _mapper.Map<InvoiceResponse>(invoice);
    }

    public async Task<InvoiceResponse> GenerateFromOpportunityAsync(
        Guid opportunityId,
        GenerateInvoiceFromOpportunityRequest request,
        CancellationToken ct = default)
    {
        if (!_tenantService.IsUserInRole("TenantAdmin") && 
            !_tenantService.IsUserInRole("SuperAdmin") &&
            !_tenantService.IsUserInRole("CompanyAdmin"))
        { 
            throw new UnauthorizedAccessException("You do not have permission to generate invoices from opportunities.");
        }

        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        // EnableRetryOnFailure() is configured for Npgsql.
        // When you start a user transaction, EF requires using the execution strategy wrapper
        // so the whole unit can be retried safely on transient failures.
        var strategy = _db.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            try
            {
                // FK check — global filter scopes to tenant automatically
                var opportunity = await _db.Opportunities
                    .FirstOrDefaultAsync(o => o.Id == opportunityId && o.TenantId == tenantId, ct)
                    ?? throw new KeyNotFoundException(
                        $"Opportunity {opportunityId} not found.");

                var customerExists = await _db.Customers
                    .AnyAsync(c => c.Id == opportunity.CustomerId && c.TenantId == tenantId, ct);
                if (!customerExists)
                    throw new InvalidOperationException(
                        $"Customer {opportunity.CustomerId} linked to opportunity no longer exists.");

                // Guard against duplicate invoice for the same opportunity
                var alreadyInvoiced = await _db.Invoices
                    .AnyAsync(i => i.OpportunityId == opportunityId && i.TenantId == tenantId, ct);
                if (alreadyInvoiced)
                    throw new InvalidOperationException(
                        $"An invoice already exists for opportunity {opportunityId}.");

                var invoice = new Invoice
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    InvoiceNumber = await GenerateInvoiceNumberAsync(ct),
                    CustomerId = opportunity.CustomerId,
                    OpportunityId = opportunityId,
                    Status = InvoiceStatus.Draft,
                    IssueDate = request.IssueDate,
                    DueDate = request.DueDate,
                    Subtotal = opportunity.EstimatedValue ?? 0m,
                    DiscountAmount = 0m,
                    TaxRate = request.TaxRate,
                    CurrencyCode = request.CurrencyCode,
                    IsDeleted = false
                };

                CalculateTotals(invoice);

                _db.Invoices.Add(invoice);
                await _db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);

                _logger.LogInformation(
                    "Invoice generated from opportunity. InvoiceId: {InvoiceId}, OpportunityId: {OppId}, TenantId: {TenantId}",
                    invoice.Id, opportunityId, tenantId);

                return _mapper.Map<InvoiceResponse>(invoice);
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(ct);
                _logger.LogError(ex,
                    "Failed to generate invoice from opportunity {OpportunityId} in tenant {TenantId}",
                    opportunityId, tenantId);
                throw;
            }
        });
    }

    public async Task<InvoiceResponse> UpdateStatusAsync(
        Guid id,
        UpdateInvoiceStatusRequest request,
        CancellationToken ct = default)
    {
        if (!_tenantService.IsUserInRole("TenantAdmin") && 
            !_tenantService.IsUserInRole("SuperAdmin") &&
            !_tenantService.IsUserInRole("CompanyAdmin"))
        {
            throw new UnauthorizedAccessException("You do not have permission to update invoice status.");
        }

        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var invoice = await _db.Invoices
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Invoice {id} not found.");

        invoice.Status = request.Status;
        if (request.Status == InvoiceStatus.Paid)
        {
            invoice.PaidAt = request.PaidAt ?? DateTimeOffset.UtcNow;
        }
        else
        {
            invoice.PaidAt = null;
        }

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Invoice status updated for Tenant {TenantId}. Id: {Id}, Status: {Status}",
            tenantId, id, request.Status);

        return _mapper.Map<InvoiceResponse>(invoice);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        if (!_tenantService.IsUserInRole("TenantAdmin") && 
            !_tenantService.IsUserInRole("SuperAdmin") &&
            !_tenantService.IsUserInRole("CompanyAdmin"))
        {
            throw new UnauthorizedAccessException("You do not have permission to delete invoices.");
        }

        Guid tenantId = _tenantService.GetCurrentTenantId() ?? throw new UnauthorizedAccessException("Tenant context is missing.");

        var invoice = await _db.Invoices
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId, ct)
            ?? throw new KeyNotFoundException($"Invoice {id} not found.");

        invoice.IsDeleted = true;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Invoice soft-deleted for Tenant {TenantId}. Id: {Id}", tenantId, id);
    }

    private static void CalculateTotals(Invoice invoice)
    {
        var afterDiscount = invoice.Subtotal - invoice.DiscountAmount;
        invoice.TaxAmount = Math.Round(afterDiscount * invoice.TaxRate, 2);
        invoice.TotalAmount = Math.Round(afterDiscount + invoice.TaxAmount, 2);
    }

    private async Task<string> GenerateInvoiceNumberAsync(CancellationToken ct)
    {
        var count = await _db.Invoices
            .IgnoreQueryFilters()
            .CountAsync(ct);

        return $"INV-{DateTimeOffset.UtcNow:yyyyMM}-{(count + 1):D5}";
    }
}
