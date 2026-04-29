using ClientSphere.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Infrastructure.Persistence.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(c => c.CompanyName).HasColumnName("company_name").HasMaxLength(255).IsRequired();
        builder.Property(c => c.Industry).HasColumnName("industry").HasMaxLength(100);
        builder.Property(c => c.Website).HasColumnName("website").HasMaxLength(500);
        builder.Property(c => c.Phone).HasColumnName("phone").HasMaxLength(50);
        builder.Property(c => c.BillingAddressLine1).HasColumnName("billing_address_line1").HasMaxLength(255);
        builder.Property(c => c.BillingAddressLine2).HasColumnName("billing_address_line2").HasMaxLength(255);
        builder.Property(c => c.BillingCity).HasColumnName("billing_city").HasMaxLength(100);
        builder.Property(c => c.BillingState).HasColumnName("billing_state").HasMaxLength(100);
        builder.Property(c => c.BillingPostalCode).HasColumnName("billing_postal_code").HasMaxLength(20);
        builder.Property(c => c.BillingCountry).HasColumnName("billing_country").HasMaxLength(2);
        builder.Property(c => c.AnnualRevenue).HasColumnName("annual_revenue").HasColumnType("numeric(18,2)");
        builder.Property(c => c.EmployeeCount).HasColumnName("employee_count");
        builder.Property(c => c.AccountOwnerId).HasColumnName("account_owner_id");
        builder.Property(c => c.Notes).HasColumnName("notes");
        builder.Property(c => c.CreatedAt).HasColumnName("created_at").HasColumnType("timestamptz");
        builder.Property(c => c.CreatedBy).HasColumnName("created_by");
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamptz");
        builder.Property(c => c.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);

        builder.HasOne(c => c.AccountOwner)
               .WithMany()
               .HasForeignKey(c => c.AccountOwnerId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(c => c.TenantId).HasDatabaseName("idx_customers_tenant_id");
        builder.HasIndex(c => new { c.TenantId, c.AccountOwnerId }).HasDatabaseName("idx_customers_owner");
        builder.HasIndex(c => new { c.TenantId, c.CompanyName }).HasDatabaseName("idx_customers_company_name");

        builder.HasQueryFilter(c => !c.IsDeleted);

        builder.HasMany(c => c.Contacts)
       .WithOne(ct => ct.Customer)
       .HasForeignKey(ct => ct.CustomerId)
       .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Invoices)
               .WithOne(i => i.Customer)
               .HasForeignKey(i => i.CustomerId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

