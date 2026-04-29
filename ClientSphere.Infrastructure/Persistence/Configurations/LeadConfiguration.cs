using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence.ValueConverters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


namespace ClientSphere.Infrastructure.Persistence.Configurations;
public class LeadConfiguration : IEntityTypeConfiguration<Lead>
{
    public void Configure(EntityTypeBuilder<Lead> builder)
    {
        builder.ToTable("leads");

        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).HasColumnName("id");
        builder.Property(l => l.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(l => l.FirstName).HasColumnName("first_name").HasMaxLength(100).IsRequired();
        builder.Property(l => l.LastName).HasColumnName("last_name").HasMaxLength(100).IsRequired();
        builder.Property(l => l.Email).HasColumnName("email").HasMaxLength(320);
        builder.Property(l => l.Phone).HasColumnName("phone").HasMaxLength(50);
        builder.Property(l => l.CompanyName).HasColumnName("company_name").HasMaxLength(255);
        builder.Property(l => l.JobTitle).HasColumnName("job_title").HasMaxLength(150);
        builder.Property(l => l.Source).HasColumnName("source").HasMaxLength(100);
        builder.Property(l => l.Status)
               .HasColumnName("status")
               .HasColumnType("lead_status");
        builder.Property(l => l.AiConversionScore).HasColumnName("ai_conversion_score");
        builder.Property(l => l.AiScoreCalculatedAt).HasColumnName("ai_score_calculated_at").HasColumnType("timestamptz");
        builder.Property(l => l.EstimatedValue).HasColumnName("estimated_value").HasColumnType("numeric(18,2)");
        builder.Property(l => l.AssignedToId).HasColumnName("assigned_to_id");
        builder.Property(l => l.ConvertedAt).HasColumnName("converted_at").HasColumnType("timestamptz");
        builder.Property(l => l.ConvertedCustomerId).HasColumnName("converted_customer_id");
        builder.Property(l => l.Notes).HasColumnName("notes");
        builder.Property(l => l.CreatedAt).HasColumnName("created_at").HasColumnType("timestamptz");
        builder.Property(l => l.CreatedBy).HasColumnName("created_by");
        builder.Property(l => l.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamptz");
        builder.Property(l => l.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);

        builder.HasOne(l => l.AssignedTo)
               .WithMany()
               .HasForeignKey(l => l.AssignedToId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(l => l.ConvertedCustomer)
               .WithMany()
               .HasForeignKey(l => l.ConvertedCustomerId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(l => l.TenantId).HasDatabaseName("idx_leads_tenant_id");
        builder.HasIndex(l => new { l.TenantId, l.Status }).HasDatabaseName("idx_leads_status");
        builder.HasIndex(l => new { l.TenantId, l.AssignedToId }).HasDatabaseName("idx_leads_assigned_to");
        builder.HasIndex(l => new { l.TenantId, l.AiConversionScore }).HasDatabaseName("idx_leads_ai_score");

        builder.HasQueryFilter(l => !l.IsDeleted);
    }
}

