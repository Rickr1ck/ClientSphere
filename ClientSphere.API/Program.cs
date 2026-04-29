using ClientSphere.API.Seeding;
using ClientSphere.Application.DTOs.Auth;
using ClientSphere.Application.DTOs.Campaigns;
using ClientSphere.Application.DTOs.Contacts;
using ClientSphere.Application.DTOs.Customers;
using ClientSphere.Application.DTOs.Invoices;
using ClientSphere.Application.DTOs.Leads;
using ClientSphere.Application.DTOs.Opportunities;
using ClientSphere.Application.DTOs.Tickets;
using ClientSphere.Application.DTOs.Users;
using ClientSphere.Application.Validators.Auth;
using ClientSphere.Application.Validators.Campaigns;
using ClientSphere.Application.Validators.Contacts;
using ClientSphere.Application.Validators.Customers;
using ClientSphere.Application.Validators.Invoices;
using ClientSphere.Application.Validators.Leads;
using ClientSphere.Application.Validators.Opportunities;
using ClientSphere.Application.Validators.Tickets;
using ClientSphere.Application.Validators.Users;
using ClientSphere.Infrastructure;
using ClientSphere.Infrastructure.Persistence;
using ClientSphere.Infrastructure.Persistence.Interceptors;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Serilog;
using Serilog.Events;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting ClientSphere API...");

    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, services, cfg) => cfg
        .ReadFrom.Configuration(ctx.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithEnvironmentName()
        .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
        .WriteTo.Console(outputTemplate:
            "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext} | {Message:lj}{NewLine}{Exception}")
        .WriteTo.File(
            path: "logs/clientsphere-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 14,
            outputTemplate:
                "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] " +
                "{SourceContext} TenantId={TenantId} UserId={UserId} " +
                "{Message:lj}{NewLine}{Exception}"));

    builder.Services
        .AddControllers()
        // Frontend sends/reads enum values as strings (e.g., "Prospecting", "Open").
        // Without this, System.Text.Json uses numbers and the UI can't render the pipeline board.
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        });
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddProblemDetails();
    builder.Services.AddMemoryCache();
    builder.Services.AddInfrastructure();

    // Initialize Stripe API Key
    Stripe.StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];

    builder.Services.AddScoped<IValidator<RegisterTenantRequest>, RegisterTenantRequestValidator>();
    builder.Services.AddScoped<IValidator<LoginRequest>, LoginRequestValidator>();

    builder.Services.AddScoped<IValidator<CreateUserRequest>, CreateUserRequestValidator>();
    builder.Services.AddScoped<IValidator<UpdateUserRequest>, UpdateUserRequestValidator>();
    builder.Services.AddScoped<IValidator<CreateContactRequest>, CreateContactRequestValidator>();
    builder.Services.AddScoped<IValidator<UpdateContactRequest>, UpdateContactRequestValidator>();

    builder.Services.AddScoped<IValidator<CreateCustomerRequest>, CreateCustomerRequestValidator>();
    builder.Services.AddScoped<IValidator<UpdateCustomerRequest>, UpdateCustomerRequestValidator>();

    builder.Services.AddScoped<IValidator<CreateLeadRequest>, CreateLeadRequestValidator>();
    builder.Services.AddScoped<IValidator<UpdateLeadRequest>, UpdateLeadRequestValidator>();

    builder.Services.AddScoped<IValidator<CreateOpportunityRequest>, CreateOpportunityRequestValidator>();
    builder.Services.AddScoped<IValidator<UpdateOpportunityRequest>, UpdateOpportunityRequestValidator>();
    builder.Services.AddScoped<IValidator<UpdateOpportunityStageRequest>, UpdateOpportunityStageRequestValidator>();
    builder.Services.AddScoped<IValidator<CreateTicketRequest>, CreateTicketRequestValidator>();
    builder.Services.AddScoped<IValidator<UpdateTicketRequest>, UpdateTicketRequestValidator>();
    builder.Services.AddScoped<IValidator<UpdateTicketStatusRequest>, UpdateTicketStatusRequestValidator>();
    builder.Services.AddScoped<IValidator<CreateCampaignRequest>, CreateCampaignRequestValidator>();
    builder.Services.AddScoped<IValidator<UpdateCampaignRequest>, UpdateCampaignRequestValidator>();
    builder.Services.AddScoped<IValidator<CreateInvoiceRequest>, CreateInvoiceRequestValidator>();
    builder.Services.AddScoped<IValidator<GenerateInvoiceFromOpportunityRequest>, GenerateInvoiceFromOpportunityRequestValidator>();

    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

    var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(connectionString);
    var translator = new Npgsql.NameTranslation.NpgsqlSnakeCaseNameTranslator();
    dataSourceBuilder.MapEnum<ClientSphere.Domain.Entities.RbacRole>("rbac_role", translator);
    dataSourceBuilder.MapEnum<ClientSphere.Domain.Entities.TicketPriority>("ticket_priority", translator);
    dataSourceBuilder.MapEnum<ClientSphere.Domain.Entities.TicketStatus>("ticket_status", translator);
    dataSourceBuilder.MapEnum<ClientSphere.Domain.Entities.AiSentimentLabel>("ai_sentiment_label", translator);
    dataSourceBuilder.MapEnum<ClientSphere.Domain.Entities.TenantStatus>("tenant_status", translator);
    dataSourceBuilder.MapEnum<ClientSphere.Domain.Entities.SubscriptionTier>("subscription_tier", translator);
    dataSourceBuilder.MapEnum<ClientSphere.Domain.Entities.OpportunityStage>("opportunity_stage", translator);
    dataSourceBuilder.MapEnum<ClientSphere.Domain.Entities.CampaignStatus>("campaign_status", translator);
    dataSourceBuilder.MapEnum<ClientSphere.Domain.Entities.LeadStatus>("lead_status", translator);
    dataSourceBuilder.MapEnum<ClientSphere.Domain.Entities.InvoiceStatus>("invoice_status", translator);
    var dataSource = dataSourceBuilder.Build();

    builder.Services.AddDbContext<ApplicationDbContext>((sp, options) =>
    {
        options.UseNpgsql(
                dataSource,
                npgsql =>
                {
                    npgsql.MigrationsAssembly("ClientSphere.Infrastructure");

                    // Runtime enum mapping for EF Core. Without this, EF may fall back to enum-as-int and
                    // PostgreSQL will reject inserts into enum-typed columns (tenant_status, rbac_role, etc.).
                    npgsql.MapEnum<ClientSphere.Domain.Entities.RbacRole>("rbac_role", "public", translator);
                    npgsql.MapEnum<ClientSphere.Domain.Entities.TicketPriority>("ticket_priority", "public", translator);
                    npgsql.MapEnum<ClientSphere.Domain.Entities.TicketStatus>("ticket_status", "public", translator);
                    npgsql.MapEnum<ClientSphere.Domain.Entities.AiSentimentLabel>("ai_sentiment_label", "public", translator);
                    npgsql.MapEnum<ClientSphere.Domain.Entities.TenantStatus>("tenant_status", "public", translator);
                    npgsql.MapEnum<ClientSphere.Domain.Entities.SubscriptionTier>("subscription_tier", "public", translator);
                    npgsql.MapEnum<ClientSphere.Domain.Entities.OpportunityStage>("opportunity_stage", "public", translator);
                    npgsql.MapEnum<ClientSphere.Domain.Entities.CampaignStatus>("campaign_status", "public", translator);
                    npgsql.MapEnum<ClientSphere.Domain.Entities.LeadStatus>("lead_status", "public", translator);
                    npgsql.MapEnum<ClientSphere.Domain.Entities.InvoiceStatus>("invoice_status", "public", translator);
                    npgsql.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(15),
                        errorCodesToAdd: null);
                })
            .AddInterceptors(sp.GetRequiredService<ClientSphere.Infrastructure.Persistence.Interceptors.AuditableEntityInterceptor>())
            .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
            .EnableDetailedErrors(builder.Environment.IsDevelopment());
    });

    var jwtSecret = builder.Configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

    builder.Services
        .AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            // Keep claim types as they are in the JWT (e.g., "tid").
            // If this is left enabled, some short claim names may be remapped and multi-tenancy breaks.
            options.MapInboundClaims = false;
            options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
            options.SaveToken = false;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ValidateIssuer = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = builder.Configuration["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),
                NameClaimType = ClaimTypes.NameIdentifier,
                RoleClaimType = ClaimTypes.Role
            };

            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = ctx =>
                {
                    Log.Warning("JWT authentication failed: {Error}", ctx.Exception.Message);
                    return Task.CompletedTask;
                },
                OnTokenValidated = ctx =>
                {
                    Log.Debug(
                        "JWT validated for subject {Sub} in tenant {TenantId}.",
                        ctx.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                        ctx.Principal?.FindFirst("tid")?.Value);
                    return Task.CompletedTask;
                }
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("SuperAdminOnly", policy => policy.RequireRole("SuperAdmin"));
        options.AddPolicy("TenantAdminOrAbove", policy => 
            policy.RequireRole("SuperAdmin", "TenantAdmin"));
        options.AddPolicy("SalesRole", policy => 
            policy.RequireRole("SuperAdmin", "SalesManager", "SalesRep"));
        options.AddPolicy("SupportRole", policy => 
            policy.RequireRole("SuperAdmin", "SupportAgent"));
        options.AddPolicy("MarketingRole", policy => 
            policy.RequireRole("SuperAdmin", "MarketingManager"));
        options.AddPolicy("ReadOnlyOrAbove", policy => 
            policy.RequireRole("SuperAdmin", "TenantAdmin", "SalesManager", "SalesRep", "SupportAgent", "MarketingManager", "ReadOnly"));
        options.AddPolicy("AnalyticsAdmin", policy => 
            policy.RequireRole("SuperAdmin", "TenantAdmin"));
    });

    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "ClientSphere CRM API",
            Version = "v1",
            Description = "Enterprise Multi-Tenant SaaS CRM"
        });

        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter your JWT token."
        });

        c.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecuritySchemeReference("Bearer", null, null),
                new List<string>()
            }
        });
    });

    builder.Services.AddCors(options =>
        options.AddPolicy("ClientSpherePolicy", policy =>
            policy
                .WithOrigins(
                    builder.Configuration
                        .GetSection("Cors:AllowedOrigins")
                        .Get<string[]>() ?? ["http://localhost:5173"])
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()));

    var app = builder.Build();

    app.UseExceptionHandler(errorApp => errorApp.Run(async ctx =>
    {
        var feature = ctx.Features.Get<IExceptionHandlerFeature>();
        var exception = feature?.Error;

        Log.Error(exception, "Unhandled exception on {Method} {Path}.", ctx.Request.Method, ctx.Request.Path);

        var statusCode = exception switch
        {
            InvalidOperationException => StatusCodes.Status409Conflict,
            UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
            KeyNotFoundException => StatusCodes.Status404NotFound,
            _ => StatusCodes.Status500InternalServerError
        };

        var title = statusCode switch
        {
            StatusCodes.Status409Conflict => "Conflict",
            StatusCodes.Status401Unauthorized => "Unauthorized",
            StatusCodes.Status404NotFound => "Not Found",
            _ => "Internal Server Error"
        };

        var problem = new ProblemDetails
        {
            Type = "https://tools.ietf.org/html/rfc9110",
            Title = title,
            Status = statusCode,
            Detail = app.Environment.IsDevelopment()
                ? exception?.Message
                : "An unexpected error occurred. Contact support.",
            Instance = ctx.Request.Path
        };

        problem.Extensions["traceId"] = ctx.TraceIdentifier;

        ctx.Response.StatusCode = statusCode;
        ctx.Response.ContentType = "application/problem+json";
        await ctx.Response.WriteAsJsonAsync(problem);
    }));

    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate =
            "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.000}ms";
        options.EnrichDiagnosticContext = (diag, ctx) =>
        {
            diag.Set("RequestHost", ctx.Request.Host.Value);
            diag.Set("RequestScheme", ctx.Request.Scheme);
            diag.Set("UserAgent", ctx.Request.Headers.UserAgent.ToString());
        };
    });

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "ClientSphere CRM v1");
            c.DisplayRequestDuration();
        });
    }

    app.UseHttpsRedirection();
    app.UseCors("ClientSpherePolicy");
    app.UseAuthentication();
    app.UseMiddleware<ClientSphere.API.Middleware.TenantStatusMiddleware>();
    app.UseAuthorization();

    // Health check endpoint for uptime monitoring and load balancer checks
    app.MapGet("/api/v1/health", () => Results.Ok(new { 
        status = "healthy", 
        timestamp = DateTimeOffset.UtcNow 
    }));

    app.MapControllers();

    if (app.Environment.IsDevelopment())
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        // If you are managing schema via SQL DDL (and haven't created EF migrations yet),
        // calling MigrateAsync will hit __EFMigrationsHistory and can fail/noise the logs.
        // Only auto-apply migrations when migrations exist in the assembly.
        if (db.Database.GetMigrations().Any())
        {
            await db.Database.MigrateAsync();
        }
        else
        {
            try
            {
                var canConnect = await db.Database.CanConnectAsync();
                Log.Information(
                    "Database connectivity check ({Database}): {CanConnect}",
                    db.Database.GetDbConnection().Database,
                    canConnect);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Database connectivity check failed.");
            }
        }

        // Dev-only: seed a Super Admin account so you can test RBAC end-to-end without manual setup.
        await DevSeeder.SeedSuperAdminAsync(db, app.Configuration, logger);
    }

    await app.RunAsync();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "ClientSphere API terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}




