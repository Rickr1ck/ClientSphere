using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Common;
using ClientSphere.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClientSphere.Infrastructure.Persistence;

public sealed class ApplicationDbContext : DbContext
{
    private readonly ITenantService _tenantService;

    private Guid? CurrentTenantId => _tenantService.GetCurrentTenantId();

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ITenantService tenantService)
        : base(options)
    {
        _tenantService = tenantService;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<Opportunity> Opportunities => Set<Opportunity>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<MarketingCampaign> Campaigns => Set<MarketingCampaign>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // IMPORTANT:
        // HasPostgresEnum<TEnum>(...) parameters are (schema, name, translator).
        // Using a single positional string argument would set the schema (wrong) and keep name null.
        modelBuilder.HasPostgresEnum<RbacRole>(schema: "public", name: "rbac_role");
        modelBuilder.HasPostgresEnum<TicketPriority>(schema: "public", name: "ticket_priority");
        modelBuilder.HasPostgresEnum<TicketStatus>(schema: "public", name: "ticket_status");
        modelBuilder.HasPostgresEnum<AiSentimentLabel>(schema: "public", name: "ai_sentiment_label");
        modelBuilder.HasPostgresEnum<TenantStatus>(schema: "public", name: "tenant_status");
        modelBuilder.HasPostgresEnum<SubscriptionTier>(schema: "public", name: "subscription_tier");
        modelBuilder.HasPostgresEnum<OpportunityStage>(schema: "public", name: "opportunity_stage");
        modelBuilder.HasPostgresEnum<CampaignStatus>(schema: "public", name: "campaign_status");
        modelBuilder.HasPostgresEnum<LeadStatus>(schema: "public", name: "lead_status");
        modelBuilder.HasPostgresEnum<InvoiceStatus>(schema: "public", name: "invoice_status");

        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        modelBuilder.Entity<Tenant>()
            .HasQueryFilter(t => !t.IsDeleted);

        modelBuilder.Entity<User>()
            .HasQueryFilter(u =>
                !u.IsDeleted &&
                u.TenantId == (CurrentTenantId ?? Guid.Empty));

        modelBuilder.Entity<Customer>()
            .HasQueryFilter(c =>
                !c.IsDeleted &&
                c.TenantId == (CurrentTenantId ?? Guid.Empty));

        modelBuilder.Entity<Contact>()
            .HasQueryFilter(c =>
                !c.IsDeleted &&
                c.TenantId == (CurrentTenantId ?? Guid.Empty));

        modelBuilder.Entity<Lead>()
            .HasQueryFilter(l =>
                !l.IsDeleted &&
                l.TenantId == (CurrentTenantId ?? Guid.Empty));

        modelBuilder.Entity<Opportunity>()
            .HasQueryFilter(o =>
                !o.IsDeleted &&
                o.TenantId == (CurrentTenantId ?? Guid.Empty));

        modelBuilder.Entity<Invoice>()
            .HasQueryFilter(i =>
                !i.IsDeleted &&
                i.TenantId == (CurrentTenantId ?? Guid.Empty));

        modelBuilder.Entity<Ticket>()
            .HasQueryFilter(t =>
                !t.IsDeleted &&
                t.TenantId == (CurrentTenantId ?? Guid.Empty));

        modelBuilder.Entity<MarketingCampaign>()
            .HasQueryFilter(c =>
                !c.IsDeleted &&
                c.TenantId == (CurrentTenantId ?? Guid.Empty));
    }

    public override int SaveChanges()
    {
        EnforceTenantIsolation();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        EnforceTenantIsolation();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void EnforceTenantIsolation()
    {
        var currentTenantId = CurrentTenantId;
        if (!currentTenantId.HasValue)
        {
            return;
        }

        var violatingEntries = ChangeTracker
            .Entries<AuditableTenantEntity>()
            .Where(entry =>
                entry.State is EntityState.Added or EntityState.Modified &&
                entry.Entity.TenantId != Guid.Empty &&
                entry.Entity.TenantId != currentTenantId.Value)
            .Select(entry => entry.Entity.Id)
            .ToArray();

        if (violatingEntries.Length == 0)
        {
            return;
        }

        throw new InvalidOperationException(
            $"Cross-tenant write violation detected for entity IDs: {string.Join(", ", violatingEntries)}.");
    }
}
