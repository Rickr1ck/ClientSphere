using ClientSphere.Application.Interfaces;
using ClientSphere.Infrastructure.AI;
using ClientSphere.Infrastructure.Mappings;
using ClientSphere.Infrastructure.Persistence.Interceptors;
using ClientSphere.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace ClientSphere.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();

        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<AuditableEntityInterceptor>();

        services.AddAutoMapper(typeof(ContactMappingProfile).Assembly);

        services.AddScoped<IContactService, ContactService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<ILeadService, LeadService>();
        services.AddScoped<IOpportunityService, OpportunityService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ITenantManagementService, TenantManagementService>();


        services.AddScoped<ITicketService, TicketService>();
        services.AddScoped<ICampaignService, CampaignService>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        services.AddScoped<ISendGridService, SendGridService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();


        // ClientSphere.Infrastructure/DependencyInjection.cs
        // Add these registrations to the existing method — do not replace existing lines

        // ONNX session manager — singleton owns all three InferenceSession instances
        // Thread-safe by OnnxRuntime design, expensive to construct, one per app lifetime
        services.AddSingleton<OnnxSessionManager>();

        // AI services — singleton: hold no mutable state, share OnnxSessionManager
        services.AddSingleton<IAiLeadScoringService, AiLeadScoringService>();
        services.AddSingleton<IAiSentimentService, AiSentimentService>();
        return services;
    }
}
