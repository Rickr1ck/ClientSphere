using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence.ValueConverters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Infrastructure.Persistence.Configurations;

public class OpportunityConfiguration : IEntityTypeConfiguration<Opportunity>
{
    public void Configure(EntityTypeBuilder<Opportunity> builder)
    {
        builder.ToTable("opportunities");

        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).HasColumnName("id");
        builder.Property(o => o.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(o => o.CustomerId).HasColumnName("customer_id").IsRequired();
        builder.Property(o => o.LeadId).HasColumnName("lead_id");
        builder.Property(o => o.Title).HasColumnName("title").HasMaxLength(255).IsRequired();
        builder.Property(o => o.Stage)
               .HasColumnName("stage")
               .HasColumnType("opportunity_stage");
        builder.Property(o => o.EstimatedValue).HasColumnName("estimated_value").HasColumnType("numeric(18,2)");
        builder.Property(o => o.Probability).HasColumnName("probability");
        builder.Property(o => o.ExpectedCloseDate).HasColumnName("expected_close_date");
        builder.Property(o => o.ClosedAt).HasColumnName("closed_at").HasColumnType("timestamptz");
        builder.Property(o => o.OwnerId).HasColumnName("owner_id").IsRequired();
        builder.Property(o => o.ClosedByUserId).HasColumnName("closed_by_user_id");
        builder.Property(o => o.AssignedToId).HasColumnName("assigned_to_id");
        builder.Property(o => o.PrimaryContactId).HasColumnName("primary_contact_id");
        builder.Property(o => o.LossReason).HasColumnName("loss_reason").HasMaxLength(500);
        builder.Property(o => o.Notes).HasColumnName("notes");
        builder.Property(o => o.CreatedAt).HasColumnName("created_at").HasColumnType("timestamptz");
        builder.Property(o => o.CreatedBy).HasColumnName("created_by");
        builder.Property(o => o.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamptz");
        builder.Property(o => o.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);

        builder.HasOne(o => o.Customer)
               .WithMany(c => c.Opportunities)
               .HasForeignKey(o => o.CustomerId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Lead)
               .WithMany()
               .HasForeignKey(o => o.LeadId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(o => o.Owner)
               .WithMany()
               .HasForeignKey(o => o.OwnerId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.ClosedByUser)
               .WithMany()
               .HasForeignKey(o => o.ClosedByUserId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(o => o.AssignedTo)
               .WithMany()
               .HasForeignKey(o => o.AssignedToId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(o => o.PrimaryContact)
               .WithMany()
               .HasForeignKey(o => o.PrimaryContactId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(o => o.TenantId).HasDatabaseName("idx_opps_tenant_id");
        builder.HasIndex(o => new { o.TenantId, o.CustomerId }).HasDatabaseName("idx_opps_customer_id");
        builder.HasIndex(o => new { o.TenantId, o.Stage }).HasDatabaseName("idx_opps_stage");
        builder.HasIndex(o => new { o.TenantId, o.AssignedToId }).HasDatabaseName("idx_opps_assigned_to");
        builder.HasIndex(o => new { o.TenantId, o.OwnerId }).HasDatabaseName("idx_opps_owner_id");
        builder.HasIndex(o => new { o.TenantId, o.ExpectedCloseDate }).HasDatabaseName("idx_opps_close_date");

        builder.HasQueryFilter(o => !o.IsDeleted);
    }
}

