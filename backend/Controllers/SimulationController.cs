using Microsoft.AspNetCore.Mvc;
using IntelliInspect.API.Services;
using IntelliInspect.API.Models;

namespace IntelliInspect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SimulationController : ControllerBase
{
    private readonly IMLService _mlService;
    private readonly ILogger<SimulationController> _logger;

    public SimulationController(IMLService mlService, ILogger<SimulationController> logger)
    {
        _mlService = mlService;
        _logger = logger;
    }

    [HttpPost("get-count")]
    public async Task<ActionResult<SimulationCount>> GetSimulationCount([FromBody] SimulationRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Invalid request data.");
            }

            _logger.LogInformation("Getting simulation count for period: {Start} to {End}",
                request.SimulationPeriod.Start, request.SimulationPeriod.End);

            var count = await _mlService.GetSimulationCountAsync(request);

            _logger.LogInformation("Simulation count retrieved: {TotalRecords} records", count.TotalRecords);

            return Ok(count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting simulation count");
            return StatusCode(500, "An error occurred while getting simulation count.");
        }
    }

    [HttpPost("predict-next")]
    public async Task<ActionResult<PredictionResult>> PredictNext([FromBody] SimulationRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Invalid request data.");
            }

            _logger.LogInformation("Getting next prediction for simulation period: {Start} to {End}",
                request.SimulationPeriod.Start, request.SimulationPeriod.End);

            var prediction = await _mlService.PredictNextAsync(request);

            _logger.LogInformation("Prediction completed: {Prediction} with {Confidence}% confidence for sample {SampleId}",
                prediction.Prediction, prediction.Confidence, prediction.SampleId);

            return Ok(prediction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during prediction");
            return StatusCode(500, "An error occurred while getting prediction.");
        }
    }
}
