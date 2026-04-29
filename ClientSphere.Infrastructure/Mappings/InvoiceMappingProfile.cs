using AutoMapper;
using ClientSphere.Application.DTOs.Invoices;
using ClientSphere.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Infrastructure.Mappings;
public sealed class InvoiceMappingProfile : Profile
{
    public InvoiceMappingProfile()
    {
        CreateMap<Invoice, InvoiceResponse>();

        CreateMap<CreateInvoiceRequest, Invoice>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(_ => Guid.NewGuid()))
            .ForMember(dest => dest.InvoiceNumber, opt => opt.Ignore()) // generated in service
            .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => InvoiceStatus.Draft))
            .ForMember(dest => dest.TaxAmount, opt => opt.Ignore()) // calculated in service
            .ForMember(dest => dest.TotalAmount, opt => opt.Ignore()) // calculated in service
            .ForMember(dest => dest.PaidAt, opt => opt.Ignore())
            .ForMember(dest => dest.StripeInvoiceId, opt => opt.Ignore())
            .ForMember(dest => dest.StripePaymentIntent, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.MapFrom(_ => false))
            .ForMember(dest => dest.TenantId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

    }
}