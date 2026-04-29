// ClientSphere.Infrastructure/AI/AiLeadScoringService.cs
using ClientSphere.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;

namespace ClientSphere.Infrastructure.AI;

public sealed class AiLeadScoringService : IAiLeadScoringService
{
    private readonly OnnxSessionManager _sessions;
    private readonly ILogger<AiLeadScoringService> _logger;

    public AiLeadScoringService(
        OnnxSessionManager sessions,
        ILogger<AiLeadScoringService> logger)
    {
        _sessions = sessions;
        _logger = logger;
    }

    public int? ScoreLead(
        string? source,
        string? jobTitle,
        string? companyName,
        decimal? estimatedValue)
    {
        try
        {
            // Build combined text — same concatenation order used in Python training
            var text = BuildLeadText(source, jobTitle, companyName, estimatedValue);

            // Step 1 — vectorize
            // IN:  string_input  [None,1]    tensor(string)
            // OUT: variable      [None,5000] tensor(float)
            var vectorized = Vectorize(text);

            // Step 2 — score
            // IN:  float_input         [None,5000] tensor(float)
            // OUT: output_label        [None]      tensor(int64)
            // OUT: output_probability  seq(map(int64, tensor(float)))
            var inputs = new List<NamedOnnxValue>
            {
                NamedOnnxValue.CreateFromTensor("float_input", vectorized)
            };

            using var results = _sessions.LeadSession.Run(inputs);

            // key 1 = positive class (converted = true)
            var probMap = results
                .First(r => r.Name == "output_probability")
                .AsEnumerable<IDictionary<long, float>>()
                .First();

            var probability = probMap.TryGetValue(1L, out var p) ? p : 0f;
            var score = (int)Math.Clamp(probability * 100f, 0f, 100f);

            _logger.LogDebug(
                "Lead scored. Probability: {Prob:F4}, Score: {Score}",
                probability, score);

            return score;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Lead scoring failed. source={Source} jobTitle={JobTitle}. " +
                "Returning null — record will save without AI score.",
                source, jobTitle);
            return null;
        }
    }

    // ── shared vectorizer call ────────────────────────────────────────────────
    private DenseTensor<float> Vectorize(string text)
    {
        // string_input expects shape [None, 1] — one sample, one text column
        var stringTensor = new DenseTensor<string>(
            new[] { text },
            new[] { 1, 1 });

        var vectorizerInputs = new List<NamedOnnxValue>
        {
            NamedOnnxValue.CreateFromTensor("string_input", stringTensor)
        };

        using var vResults = _sessions.VectorizerSession.Run(vectorizerInputs);

        // Copy data before vResults is disposed
        var raw = vResults
            .First(r => r.Name == "variable")
            .AsTensor<float>()
            .ToArray();

        return new DenseTensor<float>(raw, new[] { 1, 5000 });
    }

    private static string BuildLeadText(
        string? source,
        string? jobTitle,
        string? companyName,
        decimal? estimatedValue)
    {
        // Matches the feature concatenation used during Python training.
        // If your training script joined features differently, adjust here.
        return string.Join(" ",
            source ?? string.Empty,
            jobTitle ?? string.Empty,
            companyName ?? string.Empty,
            estimatedValue.HasValue
                ? estimatedValue.Value.ToString("F2")
                : "0.00"
        ).Trim();
    }
}