using AutoMapper;
using ClientSphere.Application.DTOs.Campaigns;
using ClientSphere.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Infrastructure.Mappings;
public sealed class CampaignMappingProfile : Profile
{
    public CampaignMappingProfile()
    {
        CreateMap<MarketingCampaign, CampaignResponse>();

        CreateMap<CreateCampaignRequest, MarketingCampaign>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(_ => Guid.NewGuid()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => CampaignStatus.Draft))
            .ForMember(dest => dest.ActualSpend, opt => opt.MapFrom(_ => 0m))
            .ForMember(dest => dest.Impressions, opt => opt.MapFrom(_ => 0))
            .ForMember(dest => dest.Clicks, opt => opt.MapFrom(_ => 0))
            .ForMember(dest => dest.Conversions, opt => opt.MapFrom(_ => 0))
            .ForMember(dest => dest.SendGridCampaignId, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.MapFrom(_ => false))
            .ForMember(dest => dest.TenantId, opt => opt.Ignore())
            .ForMember(dest => dest.OwnerId, opt => opt.Ignore()) // Set from JWT in service
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());



        CreateMap<UpdateCampaignRequest, MarketingCampaign>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.TenantId, opt => opt.Ignore())
            .ForMember(dest => dest.ActualSpend, opt => opt.Ignore())
            .ForMember(dest => dest.Impressions, opt => opt.Ignore())
            .ForMember(dest => dest.Clicks, opt => opt.Ignore())
            .ForMember(dest => dest.Conversions, opt => opt.Ignore())
            .ForMember(dest => dest.SendGridCampaignId, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
            
    }
}
