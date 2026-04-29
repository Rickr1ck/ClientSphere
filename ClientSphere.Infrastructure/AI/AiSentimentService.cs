// ClientSphere.Infrastructure/AI/AiSentimentService.cs
using ClientSphere.Application.Interfaces;
using ClientSphere.Domain.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

namespace ClientSphere.Infrastructure.AI;

public sealed class AiSentimentService : IAiSentimentService
{
    private readonly OnnxSessionManager _sessions;
    private readonly ILogger<AiSentimentService> _logger;

    public AiSentimentService(
        OnnxSessionManager sessions,
        ILogger<AiSentimentService> logger)
    {
        _sessions = sessions;
        _logger = logger;
    }

    public (AiSentimentLabel Label, decimal Score)? AnalyseSentiment(
        string subject,
        string? description)
    {
        try
        {
            var text = string.IsNullOrWhiteSpace(description)
                ? subject
                : $"{subject} {description}";

            // Step 1 — vectorize
            // IN:  string_input  [None,1]    tensor(string)
            // OUT: variable      [None,5000] tensor(float)
            var stringTensor = new DenseTensor<string>(
                new[] { text },
                new[] { 1, 1 });

            var vectorizerInputs = new List<NamedOnnxValue>
            {
                NamedOnnxValue.CreateFromTensor("string_input", stringTensor)
            };

            DenseTensor<float> vectorized;
            using (var vResults = _sessions.VectorizerSession.Run(vectorizerInputs))
            {
                var raw = vResults
                    .First(r => r.Name == "variable")
                    .AsTensor<float>()
                    .ToArray();

                vectorized = new DenseTensor<float>(raw, new[] { 1, 5000 });
            }

            // Step 2 — classify
            // IN:  float_input         [None,5000] tensor(float)
            // OUT: output_label        [None]      tensor(string)
            // OUT: output_probability  seq(map(string, tensor(float)))
            var sentimentInputs = new List<NamedOnnxValue>
            {
                NamedOnnxValue.CreateFromTensor("float_input", vectorized)
            };

            using var sResults = _sessions.SentimentSession.Run(sentimentInputs);

            // Extract predicted label string
            var rawLabel = sResults
                .First(r => r.Name == "output_label")
                .AsTensor<string>()
                .GetValue(0);

            if (!Enum.TryParse<AiSentimentLabel>(
                    rawLabel, ignoreCase: true, out var label))
            {
                _logger.LogWarning(
                    "Sentiment model returned unrecognised label '{Label}'. " +
                    "Returning null.", rawLabel);
                return null;
            }

            // Extract confidence for the predicted label
            var probMap = sResults
                .First(r => r.Name == "output_probability")
                .AsEnumerable<IDictionary<string, float>>()
                .First();

            var confidence = probMap.TryGetValue(rawLabel, out var c) ? c : 0f;

            // Negative/Urgent → negative score to match NUMERIC(4,3) convention
            // Positive/Neutral → positive score
            var signed = label is AiSentimentLabel.Negative or AiSentimentLabel.Urgent
                ? -(decimal)Math.Round(confidence, 3)
                : (decimal)Math.Round(confidence, 3);

            var clamped = Math.Clamp(signed, -1.000m, 1.000m);

            _logger.LogDebug(
                "Sentiment analysed. Label: {Label}, Score: {Score}",
                label, clamped);

            return (label, clamped);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Sentiment analysis failed for subject='{Subject}'. " +
                "Returning null — ticket will save without AI sentiment.",
                subject);
            return null;
        }
    }
}