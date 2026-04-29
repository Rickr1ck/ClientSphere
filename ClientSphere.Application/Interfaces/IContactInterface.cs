using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Contacts;

namespace ClientSphere.Application.Interfaces;

public interface IContactService
{
    Task<PagedResult<ContactResponse>> GetByCustomerAsync(Guid customerId, int page, int pageSize, CancellationToken ct = default);
    Task<ContactResponse> GetByIdAsync(Guid contactId, CancellationToken ct = default);
    Task<ContactResponse> CreateAsync(CreateContactRequest request, CancellationToken ct = default);
    Task<ContactResponse> UpdateAsync(Guid contactId, UpdateContactRequest request, CancellationToken ct = default);
    Task DeleteAsync(Guid contactId, CancellationToken ct = default);
}
