using AutoMapper;
using ClientSphere.Application.DTOs.Contacts;
using ClientSphere.Domain.Entities;

namespace ClientSphere.Infrastructure.Mappings;

public sealed class ContactMappingProfile : Profile {

    public ContactMappingProfile()
    {
        CreateMap<Contact, ContactResponse>();

        CreateMap<CreateContactRequest, Contact>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid()))
            .ForMember(dest => dest.IsDeleted, opt => opt.MapFrom(_ => false))
            .ForMember(dest => dest.TenantId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTimeOffset.UtcNow))
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        CreateMap<UpdateContactRequest,Contact>()
            .ForMember(dest=>dest.Id, opt=> opt.Ignore())
            .ForMember(dest=>dest.TenantId, opt=> opt.Ignore())
            .ForMember(dest=>dest.CustomerId, opt=> opt.Ignore())
            .ForMember(dest=>dest.IsDeleted, opt=> opt.Ignore())
            .ForMember(dest=>dest.CreatedAt, opt=> opt.Ignore())
            .ForMember(dest=>dest.CreatedBy, opt=> opt.Ignore())
            .ForMember(dest=>dest.UpdatedAt, opt=> opt.MapFrom(_ => DateTimeOffset.UtcNow));


    }

}