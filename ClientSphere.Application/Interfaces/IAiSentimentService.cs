// ClientSphere.Application/Interfaces/IAiSentimentService.cs
using ClientSphere.Domain.Entities;

namespace ClientSphere.Application.Interfaces;

public interface IAiSentimentService
{
    /// <summary>
    /// Returns predicted sentiment label and confidence score -1.000 to 1.000.
    /// Returns null if the model fails — never blocks a save.
    /// </summary>
    (AiSentimentLabel Label, decimal Score)? AnalyseSentiment(
        string subject,
        string? description);
}