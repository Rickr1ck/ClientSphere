using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.Interfaces;

public interface ISendGridService
{
    Task<string> CreateCampaignAsync(
        string name,
        string subject,
        string htmlContent,
        CancellationToken ct = default);

    Task SendCampaignAsync(
        string sendGridCampaignId,
        CancellationToken ct = default);
}
