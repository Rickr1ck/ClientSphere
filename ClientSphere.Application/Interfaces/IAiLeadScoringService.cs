using System;
using System.Collections.Generic;
using System.Text;

namespace ClientSphere.Application.Interfaces;

public interface IAiLeadScoringService
{
    /// <summary>
    /// Returns a conversion probability score 0–100.
    /// Returns null if the model fails — never blocks a save.
    /// </summary>

    int? ScoreLead(
        string? source,
        string? jobTitle,
        string? companyName,
        decimal? estimatedValue
        );
}
