// ClientSphere.Infrastructure/AI/OnnxSessionManager.cs
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.ML.OnnxRuntime;

namespace ClientSphere.Infrastructure.AI;

/// <summary>
/// Owns all three InferenceSession instances.
/// Registered as singleton — sessions are thread-safe and expensive to construct.
/// Disposed automatically by the DI container on application shutdown.
/// </summary>
public sealed class OnnxSessionManager : IDisposable
{
    public InferenceSession VectorizerSession { get; }
    public InferenceSession LeadSession { get; }
    public InferenceSession SentimentSession { get; }

    private readonly ILogger<OnnxSessionManager> _logger;
    private bool _disposed;

    public OnnxSessionManager(
        IConfiguration config,
        ILogger<OnnxSessionManager> logger)
    {
        _logger = logger;

        var vectorizerPath = ResolvePath(config, "AiModels:VectorizerPath");
        var leadPath = ResolvePath(config, "AiModels:LeadModelPath");
        var sentimentPath = ResolvePath(config, "AiModels:SentimentModelPath");

        var opts = new SessionOptions
        {
            InterOpNumThreads = 1,
            IntraOpNumThreads = Environment.ProcessorCount,
            GraphOptimizationLevel = GraphOptimizationLevel.ORT_ENABLE_ALL
        };

        VectorizerSession = new InferenceSession(vectorizerPath, opts);
        LeadSession = new InferenceSession(leadPath, opts);
        SentimentSession = new InferenceSession(sentimentPath, opts);

        _logger.LogInformation(
            "ONNX sessions loaded. Vectorizer: {V}, Lead: {L}, Sentiment: {S}",
            vectorizerPath, leadPath, sentimentPath);
    }

    private static string ResolvePath(IConfiguration config, string key)
    {
        var relative = config[key]
            ?? throw new InvalidOperationException(
                $"ONNX model path not configured: '{key}'. " +
                $"Add it to AiModels section in appsettings.json.");

        var full = Path.IsPathRooted(relative)
            ? relative
            : Path.Combine(AppContext.BaseDirectory, relative);

        if (!File.Exists(full))
            throw new FileNotFoundException(
                $"ONNX model not found at '{full}'. " +
                $"Ensure the file is placed in ClientSphere.API/Models/ " +
                $"and CopyToOutputDirectory is set to PreserveNewest in the .csproj.",
                full);

        return full;
    }

    public void Dispose()
    {
        if (_disposed) return;
        VectorizerSession.Dispose();
        LeadSession.Dispose();
        SentimentSession.Dispose();
        _disposed = true;
    }
}