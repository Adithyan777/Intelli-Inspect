using IntelliInspect.API.Models;

namespace IntelliInspect.API.Services;

public interface IMLService
{
    Task<TrainingMetrics> TrainModelAsync(TrainingRequest request);
    Task<PredictionResult> PredictNextAsync(SimulationRequest request);
    Task<SimulationCount> GetSimulationCountAsync(SimulationRequest request);
}
