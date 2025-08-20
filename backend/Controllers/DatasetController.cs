using Microsoft.AspNetCore.Mvc;
using IntelliInspect.API.Services;
using IntelliInspect.API.Models;

namespace IntelliInspect.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DatasetController : ControllerBase
{
    private readonly IDatasetService _datasetService;
    private readonly ILogger<DatasetController> _logger;

    public DatasetController(IDatasetService datasetService, ILogger<DatasetController> logger)
    {
        _datasetService = datasetService;
        _logger = logger;
    }

    [HttpPost("upload")]
    public async Task<ActionResult<DatasetMetadata>> UploadDataset(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file was uploaded.");
            }

            if (!file.FileName.ToLower().EndsWith(".csv"))
            {
                return BadRequest("Only CSV files are supported.");
            }

            _logger.LogInformation("Processing dataset upload: {FileName}", file.FileName);

            var metadata = await _datasetService.ProcessDatasetAsync(file);

            _logger.LogInformation("Dataset processed successfully: {TotalRecords} records, {TotalColumns} columns", 
                metadata.TotalRecords, metadata.TotalColumns);

            return Ok(metadata);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing dataset upload");
            return StatusCode(500, "An error occurred while processing the dataset.");
        }
    }

    [HttpPost("validate-ranges")]
    public async Task<ActionResult<DateRangeValidation>> ValidateDateRanges([FromBody] DateRangeRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Invalid request data.");
            }

            _logger.LogInformation("Validating date ranges for training: {TrainingStart} to {TrainingEnd}, " +
                "testing: {TestingStart} to {TestingEnd}, simulation: {SimulationStart} to {SimulationEnd}",
                request.TrainingPeriod.Start, request.TrainingPeriod.End,
                request.TestingPeriod.Start, request.TestingPeriod.End,
                request.SimulationPeriod.Start, request.SimulationPeriod.End);

            var validation = await _datasetService.ValidateDateRangesAsync(request);

            _logger.LogInformation("Date range validation completed. Valid: {IsValid}, " +
                "Training records: {TrainingRecords}, Testing records: {TestingRecords}, Simulation records: {SimulationRecords}",
                validation.IsValid, validation.TrainingRecords, validation.TestingRecords, validation.SimulationRecords);

            return Ok(validation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating date ranges");
            return StatusCode(500, "An error occurred while validating date ranges.");
        }
    }
}
