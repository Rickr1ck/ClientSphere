using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence.ValueConverters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


namespace ClientSphere.Infrastructure.Persistence.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.ToTable("invoices");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(i => i.InvoiceNumber).HasColumnName("invoice_number").HasMaxLength(50).IsRequired();
        builder.Property(i => i.CustomerId).HasColumnName("customer_id").IsRequired();
        builder.Property(i => i.OpportunityId).HasColumnName("opportunity_id");
        builder.Property(i => i.Status)
               .HasColumnName("status")
               .HasColumnType("invoice_status");
        builder.Property(i => i.IssueDate).HasColumnName("issue_date");
        builder.Property(i => i.DueDate).HasColumnName("due_date");
        builder.Property(i => i.PaidAt).HasColumnName("paid_at").HasColumnType("timestamptz");
        builder.Property(i => i.Subtotal).HasColumnName("subtotal").HasColumnType("numeric(18,2)");
        builder.Property(i => i.DiscountAmount).HasColumnName("discount_amount").HasColumnType("numeric(18,2)");
        builder.Property(i => i.TaxRate).HasColumnName("tax_rate").HasColumnType("numeric(5,4)");
        builder.Property(i => i.TaxAmount).HasColumnName("tax_amount").HasColumnType("numeric(18,2)");
        builder.Property(i => i.TotalAmount).HasColumnName("total_amount").HasColumnType("numeric(18,2)");
        builder.Property(i => i.CurrencyCode).HasColumnName("currency_code").HasMaxLength(3).HasDefaultValue("USD");
        builder.Property(i => i.StripeInvoiceId).HasColumnName("stripe_invoice_id").HasMaxLength(255);
        builder.Property(i => i.StripePaymentIntent).HasColumnName("stripe_payment_intent").HasMaxLength(255);
        builder.Property(i => i.Notes).HasColumnName("notes");
        builder.Property(i => i.CreatedAt).HasColumnName("created_at").HasColumnType("timestamptz");
        builder.Property(i => i.CreatedBy).HasColumnName("created_by");
        builder.Property(i => i.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamptz");
        builder.Property(i => i.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);

        builder.HasIndex(i => new { i.TenantId, i.InvoiceNumber })
               .IsUnique()
               .HasDatabaseName("uq_invoices_number");
        builder.HasIndex(i => i.StripeInvoiceId)
               .IsUnique()
               .HasDatabaseName("uq_invoices_stripe_id")
               .HasFilter("stripe_invoice_id IS NOT NULL");

        builder.HasOne(i => i.Customer)
               .WithMany(c => c.Invoices)
               .HasForeignKey(i => i.CustomerId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.Opportunity)
               .WithMany()
               .HasForeignKey(i => i.OpportunityId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(i => new { i.TenantId })
               .HasDatabaseName("idx_invoices_tenant_id");
        builder.HasIndex(i => new { i.TenantId, i.CustomerId })
               .HasDatabaseName("idx_invoices_customer_id");
        builder.HasIndex(i => new { i.TenantId, i.Status })
               .HasDatabaseName("idx_invoices_status");
        builder.HasIndex(i => new { i.TenantId, i.DueDate })
               .HasDatabaseName("idx_invoices_due_date");

        builder.HasQueryFilter(i => !i.IsDeleted);
    }
}

