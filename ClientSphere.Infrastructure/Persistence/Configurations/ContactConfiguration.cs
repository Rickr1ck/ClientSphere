using ClientSphere.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


namespace ClientSphere.Infrastructure.Persistence.Configurations;

public class ContactConfiguration : IEntityTypeConfiguration<Contact>
{
    public void Configure(EntityTypeBuilder<Contact> builder) {
        builder.ToTable("contacts");

        builder.HasKey (c=>c.Id);
        builder.Property(c => c.Id).HasColumnName("id").IsRequired();
        builder.Property(c=>c.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(c => c.CustomerId).HasColumnName("customer_id").IsRequired();
        builder.Property(c => c.FirstName).HasColumnName("first_name").IsRequired().HasMaxLength(100);
        builder.Property(c => c.LastName).HasColumnName("last_name").IsRequired().HasMaxLength(100);
        builder.Property(c => c.Email).HasColumnName("email").HasMaxLength(255);
        builder.Property(c => c.Phone).HasColumnName("phone").HasMaxLength(50);
        builder.Property(c => c.JobTitle).HasColumnName("job_title").HasMaxLength(150);
        builder.Property(c => c.Department).HasColumnName("department").HasMaxLength(100);
        builder.Property(c => c.IsPrimary).HasColumnName("is_primary").HasDefaultValue(false);
        builder.Property(c => c.LinkedInUrl).HasColumnName("linkedin_url").HasMaxLength(500);
        builder.Property(c => c.ContactOwnerId).HasColumnName("contact_owner_id");
        builder.Property(c => c.Notes).HasColumnName("notes");
        builder.Property(c => c.CreatedAt).HasColumnName("created_at").HasColumnType("timestamptz");
        builder.Property(c => c.CreatedBy).HasColumnName("created_by");
        builder.Property(c=>c.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamptz");
        builder.Property(c => c.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);

        builder.HasOne (c=>c.Customer)
            .WithMany(cu=>cu.Contacts)
            .HasForeignKey (c => c.CustomerId)
            .OnDelete (DeleteBehavior.Cascade);

        builder.HasOne(c => c.ContactOwner)
            .WithMany()
            .HasForeignKey(c => c.ContactOwnerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(c => new { c.TenantId })
              .HasDatabaseName("idx_contacts_tenant_id");
        builder.HasIndex(c => new { c.TenantId, c.CustomerId })
               .HasDatabaseName("idx_contacts_customer_id");
        builder.HasIndex(c => new { c.TenantId, c.Email })
               .HasDatabaseName("idx_contacts_email");
        builder.HasIndex(c => new { c.CustomerId, c.IsPrimary })
               .HasDatabaseName("idx_contacts_primary");

        builder.HasQueryFilter(c => !c.IsDeleted);





    }

}

