using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence.ValueConverters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ClientSphere.Infrastructure.Persistence.Configurations;

public sealed class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("tenants");
        builder.HasKey(x => x.Id).HasName("pk_tenants");

        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
        builder.Property(x => x.Slug).HasColumnName("slug").HasMaxLength(100).IsRequired();
        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasColumnType("tenant_status")
            .IsRequired();
        builder.Property(x => x.SubscriptionTier)
            .HasColumnName("subscription_tier")
            .HasColumnType("subscription_tier")
            .IsRequired();
        builder.Property(x => x.StripeCustomerId).HasColumnName("stripe_customer_id").HasMaxLength(255);
        builder.Property(x => x.StripeSubscriptionId).HasColumnName("stripe_subscription_id").HasMaxLength(255);
        builder.Property(x => x.TrialEndsAt).HasColumnName("trial_ends_at").HasColumnType("timestamptz");
        builder.Property(x => x.SubscriptionEndsAt).HasColumnName("subscription_ends_at").HasColumnType("timestamptz");
        builder.Property(x => x.MaxUsers).HasColumnName("max_users");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("timestamptz");
        builder.Property(x => x.CreatedBy).HasColumnName("created_by");
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamptz");
        builder.Property(x => x.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);

        builder.HasIndex(x => x.Slug)
            .IsUnique()
            .HasDatabaseName("uq_tenants_slug");

        builder.HasIndex(x => x.StripeCustomerId)
            .IsUnique()
            .HasDatabaseName("uq_tenants_stripe_cust");
    }
}


