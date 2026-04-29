using System;
using System.Collections.Generic;
using System.Text;

using ClientSphere.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace ClientSphere.Infrastructure.Services;

// Mock implementation to keep the integration boundary stable until we lock a SendGrid SDK/package.
public sealed class SendGridService : ISendGridService
{
    private readonly ILogger<SendGridService> _logger;

    public SendGridService(ILogger<SendGridService> logger)
    {
        _logger = logger;
    }

    public Task<string> CreateCampaignAsync(
        string name,
        string subject,
        string htmlContent,
        CancellationToken ct = default)
    {
        // In real integration we'd call SendGrid API and store returned campaign ID.
        var id = $"mock-sg-{Guid.NewGuid():N}";

        _logger.LogInformation(
            "Mock SendGrid campaign created. Name: {Name}, Subject: {Subject}, Id: {Id}",
            name,
            subject,
            id);

        return Task.FromResult(id);
    }

    public Task SendCampaignAsync(string sendGridCampaignId, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Mock SendGrid campaign send requested. Id: {Id}",
            sendGridCampaignId);

        return Task.CompletedTask;
    }
}
