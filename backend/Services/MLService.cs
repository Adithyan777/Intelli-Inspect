using IntelliInspect.API.Models;
using System.Text;
using System.Text.Json;

namespace IntelliInspect.API.Services;

public class MLService : IMLService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MLService> _logger;

    public MLService(HttpClient httpClient, ILogger<MLService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<TrainingMetrics> TrainModelAsync(TrainingRequest request)
    {
        try
        {
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/train", content);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var metrics = JsonSerializer.Deserialize<TrainingMetrics>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (metrics == null)
            {
                throw new InvalidOperationException("Failed to deserialize training metrics from ML service");
            }

            _logger.LogInformation("Model training completed successfully");
            return metrics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during model training");
            throw new InvalidOperationException($"Failed to train model: {ex.Message}", ex);
        }
    }

    public async Task<PredictionResult> PredictNextAsync(SimulationRequest request)
    {
        try
        {
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/predict-next", content);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var prediction = JsonSerializer.Deserialize<PredictionResult>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (prediction == null)
            {
                throw new InvalidOperationException("Failed to deserialize prediction result from ML service");
            }

            return prediction;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during prediction");
            throw new InvalidOperationException($"Failed to get prediction: {ex.Message}", ex);
        }
    }

    public async Task<SimulationCount> GetSimulationCountAsync(SimulationRequest request)
    {
        try
        {
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/simulation-count", content);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var count = JsonSerializer.Deserialize<SimulationCount>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (count == null)
            {
                throw new InvalidOperationException("Failed to deserialize simulation count from ML service");
            }

            return count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting simulation count");
            throw new InvalidOperationException($"Failed to get simulation count: {ex.Message}", ex);
        }
    }
}
