using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence.ValueConverters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Infrastructure.Persistence.Configurations;

public class MarketingCampaignConfiguration : IEntityTypeConfiguration<MarketingCampaign>
{
    public void Configure(EntityTypeBuilder<MarketingCampaign> builder)
    {
        builder.ToTable("marketing_campaigns");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(c => c.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
        builder.Property(c => c.Description).HasColumnName("description");
        builder.Property(c => c.Status)
               .HasColumnName("status")
               .HasColumnName("status")
               .HasColumnType("campaign_status");
        builder.Property(c => c.Channel).HasColumnName("channel").HasMaxLength(100);
        builder.Property(c => c.Budget).HasColumnName("budget").HasColumnType("numeric(18,2)");
        builder.Property(c => c.ActualSpend).HasColumnName("actual_spend").HasColumnType("numeric(18,2)").HasDefaultValue(0m);
        builder.Property(c => c.TargetAudience).HasColumnName("target_audience");
        builder.Property(c => c.StartDate).HasColumnName("start_date");
        builder.Property(c => c.EndDate).HasColumnName("end_date");
        builder.Property(c => c.SendGridCampaignId).HasColumnName("sendgrid_campaign_id").HasMaxLength(255);
        builder.Property(c => c.Impressions).HasColumnName("impressions").HasDefaultValue(0);
        builder.Property(c => c.Clicks).HasColumnName("clicks").HasDefaultValue(0);
        builder.Property(c => c.Conversions).HasColumnName("conversions").HasDefaultValue(0);
        builder.Property(c => c.OwnerId).HasColumnName("owner_id").IsRequired();
        builder.Property(c => c.CreatedAt).HasColumnName("created_at").HasColumnType("timestamptz");
        builder.Property(c => c.CreatedBy).HasColumnName("created_by");
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamptz");
        builder.Property(c => c.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);

        builder.HasOne(c => c.Owner)
               .WithMany()
               .HasForeignKey(c => c.OwnerId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => c.TenantId).HasDatabaseName("idx_campaigns_tenant_id");
        builder.HasIndex(c => new { c.TenantId, c.Status }).HasDatabaseName("idx_campaigns_status");
        builder.HasIndex(c => new { c.TenantId, c.OwnerId }).HasDatabaseName("idx_campaigns_owner");

        builder.HasQueryFilter(c => !c.IsDeleted);
    }
}


