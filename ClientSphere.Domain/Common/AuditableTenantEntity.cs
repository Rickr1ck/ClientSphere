namespace ClientSphere.Domain.Common;

public abstract class AuditableTenantEntity : AuditableEntity
{
    public Guid TenantId { get; set; }
}
