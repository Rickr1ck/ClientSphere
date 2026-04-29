using AutoMapper;
using ClientSphere.Application.DTOs.Tickets;
using ClientSphere.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Infrastructure.Mappings;
public sealed class TicketMappingProfile : Profile
{
    public TicketMappingProfile()
    {
        CreateMap<Ticket, TicketResponse>();

        CreateMap<CreateTicketRequest, Ticket>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(_ => Guid.NewGuid()))
            .ForMember(dest => dest.TicketNumber, opt => opt.Ignore()) // generated in service
            .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => TicketStatus.Open))
            .ForMember(dest => dest.IsDeleted, opt => opt.MapFrom(_ => false))
            .ForMember(dest => dest.AiSentimentLabel, opt => opt.Ignore())
            .ForMember(dest => dest.AiSentimentScore, opt => opt.Ignore())
            .ForMember(dest => dest.AiAnalyzedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ResolvedAt, opt => opt.Ignore())
            .ForMember(dest => dest.FirstResponseAt, opt => opt.Ignore())
            .ForMember(dest => dest.TenantId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());


        CreateMap<UpdateTicketRequest, Ticket>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.TenantId, opt => opt.Ignore())
            .ForMember(dest => dest.CustomerId, opt => opt.Ignore())
            .ForMember(dest => dest.TicketNumber, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            .ForMember(dest => dest.AiSentimentLabel, opt => opt.Ignore())
            .ForMember(dest => dest.AiSentimentScore, opt => opt.Ignore())
            .ForMember(dest => dest.AiAnalyzedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ResolvedAt, opt => opt.Ignore())
            .ForMember(dest => dest.FirstResponseAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
            
    }
}