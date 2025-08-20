using Microsoft.AspNetCore.Mvc;
using IntelliInspect.API.Services;
using IntelliInspect.API.Models;

namespace IntelliInspect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ModelController : ControllerBase
{
    private readonly IMLService _mlService;
    private readonly ILogger<ModelController> _logger;

    public ModelController(IMLService mlService, ILogger<ModelController> logger)
    {
        _mlService = mlService;
        _logger = logger;
    }

    [HttpPost("train")]
    public async Task<ActionResult<TrainingMetrics>> TrainModel([FromBody] TrainingRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Invalid request data.");
            }

            _logger.LogInformation("Starting model training for training period: {TrainingStart} to {TrainingEnd}, " +
                "testing period: {TestingStart} to {TestingEnd}",
                request.TrainingPeriod.Start, request.TrainingPeriod.End,
                request.TestingPeriod.Start, request.TestingPeriod.End);

            var metrics = await _mlService.TrainModelAsync(request);

            _logger.LogInformation("Model training completed successfully. Accuracy: {Accuracy}%, " +
                "Precision: {Precision}%, Recall: {Recall}%, F1-Score: {F1Score}%",
                metrics.Accuracy, metrics.Precision, metrics.Recall, metrics.F1Score);

            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during model training");
            return StatusCode(500, "An error occurred while training the model.");
        }
    }
}
