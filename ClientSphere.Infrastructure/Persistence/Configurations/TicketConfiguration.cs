using ClientSphere.Domain.Entities;
using ClientSphere.Infrastructure.Persistence.ValueConverters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


namespace ClientSphere.Infrastructure.Persistence.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.ToTable("tickets");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id");
        builder.Property(t => t.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(t => t.TicketNumber).HasColumnName("ticket_number").HasMaxLength(30).IsRequired();
        builder.Property(t => t.CustomerId).HasColumnName("customer_id").IsRequired();
        builder.Property(t => t.ContactId).HasColumnName("contact_id");
        builder.Property(t => t.Subject).HasColumnName("subject").HasMaxLength(500).IsRequired();
        builder.Property(t => t.Description).HasColumnName("description");
        builder.Property(t => t.Priority)
               .HasColumnName("priority")
               .HasColumnName("priority")
               .HasColumnType("ticket_priority");
        builder.Property(t => t.Status)
               .HasColumnName("status")
               .HasColumnName("status")
               .HasColumnType("ticket_status");
        builder.Property(t => t.AiSentimentLabel)
               .HasColumnName("ai_sentiment_label")
               .HasColumnName("ai_sentiment_label")
               .HasColumnType("ai_sentiment_label");
        builder.Property(t => t.AiSentimentScore).HasColumnName("ai_sentiment_score").HasColumnType("numeric(4,3)");
        builder.Property(t => t.AiAnalyzedAt).HasColumnName("ai_analyzed_at").HasColumnType("timestamptz");
        builder.Property(t => t.AssignedToId).HasColumnName("assigned_to_id");
        builder.Property(t => t.CreatedByUserId).HasColumnName("created_by_user_id").IsRequired();
        builder.Property(t => t.ResolvedAt).HasColumnName("resolved_at").HasColumnType("timestamptz");
        builder.Property(t => t.FirstResponseAt).HasColumnName("first_response_at").HasColumnType("timestamptz");
        builder.Property(t => t.DueAt).HasColumnName("due_at").HasColumnType("timestamptz");
        builder.Property(t => t.Tags).HasColumnName("tags").HasColumnType("text[]");
        builder.Property(t => t.CreatedAt).HasColumnName("created_at").HasColumnType("timestamptz");
        builder.Property(t => t.CreatedBy).HasColumnName("created_by");
        builder.Property(t => t.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamptz");
        builder.Property(t => t.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);

        builder.HasIndex(t => new { t.TenantId, t.TicketNumber })
               .IsUnique()
               .HasDatabaseName("uq_tickets_number_tenant");

        builder.HasOne(t => t.Customer)
               .WithMany()
               .HasForeignKey(t => t.CustomerId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Contact)
               .WithMany()
               .HasForeignKey(t => t.ContactId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.AssignedTo)
               .WithMany()
               .HasForeignKey(t => t.AssignedToId)
               .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.CreatedByUser)
               .WithMany()
               .HasForeignKey(t => t.CreatedByUserId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => t.TenantId).HasDatabaseName("idx_tickets_tenant_id");
        builder.HasIndex(t => new { t.TenantId, t.CustomerId }).HasDatabaseName("idx_tickets_customer_id");
        builder.HasIndex(t => new { t.TenantId, t.Status }).HasDatabaseName("idx_tickets_status");
        builder.HasIndex(t => new { t.TenantId, t.Priority }).HasDatabaseName("idx_tickets_priority");
        builder.HasIndex(t => new { t.TenantId, t.AssignedToId }).HasDatabaseName("idx_tickets_assigned_to");
        builder.HasIndex(t => new { t.TenantId, t.CreatedByUserId }).HasDatabaseName("idx_tickets_created_by");

        builder.HasQueryFilter(t => !t.IsDeleted);
    }
}


