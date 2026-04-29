using ClientSphere.Application.DTOs.Common;
using ClientSphere.Application.DTOs.Customers;

namespace ClientSphere.Application.Interfaces;

public interface ICustomerService
{
    Task<PagedResult<CustomerResponse>> GetAsync(
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<CustomerResponse> GetByIdAsync(
        Guid customerId,
        CancellationToken ct = default);

    Task<CustomerResponse> CreateAsync(
        CreateCustomerRequest request,
        CancellationToken ct = default);

    Task<CustomerResponse> UpdateAsync(
        Guid customerId,
        UpdateCustomerRequest request,
        CancellationToken ct = default);

    Task DeleteAsync(
        Guid customerId,
        CancellationToken ct = default);
}

