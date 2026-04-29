using AutoMapper;
using ClientSphere.Application.DTOs.Leads;
using ClientSphere.Domain.Entities;

namespace ClientSphere.Infrastructure.Mappings;

public sealed class LeadMappingProfile : Profile
{
    public LeadMappingProfile()
    {
        CreateMap<Lead, LeadResponse>()
            // Entity stores SMALLINT; API surface uses int? (0-100).
            .ForMember(dest => dest.AiConversionScore, opt => opt.MapFrom(src => (int?)src.AiConversionScore));

        CreateMap<CreateLeadRequest, Lead>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(_ => Guid.NewGuid()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => LeadStatus.New))
            .ForMember(dest => dest.AiConversionScore, opt => opt.Ignore())
            .ForMember(dest => dest.AiScoreCalculatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ConvertedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ConvertedCustomerId, opt => opt.Ignore())
            .ForMember(dest => dest.AssignedTo, opt => opt.Ignore())
            .ForMember(dest => dest.ConvertedCustomer, opt => opt.Ignore())
            .ForMember(dest => dest.TenantId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.MapFrom(_ => false));

        CreateMap<UpdateLeadRequest, Lead>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.TenantId, opt => opt.Ignore())
            .ForMember(dest => dest.AiConversionScore, opt => opt.Ignore())
            .ForMember(dest => dest.AiScoreCalculatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ConvertedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ConvertedCustomerId, opt => opt.Ignore())
            .ForMember(dest => dest.AssignedTo, opt => opt.Ignore())
            .ForMember(dest => dest.ConvertedCustomer, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore());
    }
}

