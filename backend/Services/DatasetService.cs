using CsvHelper;
using IntelliInspect.API.Models;
using System.Globalization;

namespace IntelliInspect.API.Services;

public class DatasetService : IDatasetService
{
    private List<dynamic> _dataset = new();
    private string _fileName = string.Empty;

    public async Task<DatasetMetadata> ProcessDatasetAsync(IFormFile file)
    {
        _fileName = file.FileName;
        
        using var reader = new StreamReader(file.OpenReadStream());
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
        
        _dataset = csv.GetRecords<dynamic>().ToList();
        
        // Add synthetic timestamps if not present
        if (!_dataset.Any() || !HasTimestampColumn())
        {
            AddSyntheticTimestamps();
        }
        
        var metadata = new DatasetMetadata
        {
            FileName = _fileName,
            TotalRecords = _dataset.Count,
            TotalColumns = GetColumnCount(),
            PassRate = CalculatePassRate(),
            DateRange = GetDateRange()
        };
        
        return metadata;
    }

    public async Task<DateRangeValidation> ValidateDateRangesAsync(DateRangeRequest request)
    {
        var validation = new DateRangeValidation();
        
        try
        {
            // Validate date logic
            if (!ValidateDateLogic(request))
            {
                validation.IsValid = false;
                validation.Message = "Invalid date ranges: dates must be sequential and non-overlapping.";
                return validation;
            }
            
            // Count records in each period
            validation.TrainingRecords = await GetRecordCountInRangeAsync(request.TrainingPeriod);
            validation.TestingRecords = await GetRecordCountInRangeAsync(request.TestingPeriod);
            validation.SimulationRecords = await GetRecordCountInRangeAsync(request.SimulationPeriod);
            
            // Get monthly breakdown
            validation.MonthlyBreakdown = await GetMonthlyBreakdownAsync(request);
            
            validation.IsValid = true;
            validation.Message = "Date ranges validated successfully!";
        }
        catch (Exception ex)
        {
            validation.IsValid = false;
            validation.Message = $"Error validating date ranges: {ex.Message}";
        }
        
        return validation;
    }

    public async Task<List<MonthlyBreakdown>> GetMonthlyBreakdownAsync(DateRangeRequest request)
    {
        var breakdown = new List<MonthlyBreakdown>();
        
        // Group records by month and count by period
        var monthlyData = _dataset
            .GroupBy(record => GetMonthFromRecord(record))
            .OrderBy(g => g.Key)
            .ToList();
        
        foreach (var monthGroup in monthlyData)
        {
            var monthBreakdown = new MonthlyBreakdown
            {
                Month = monthGroup.Key,
                Training = monthGroup.Count(r => IsInRange(r, request.TrainingPeriod)),
                Testing = monthGroup.Count(r => IsInRange(r, request.TestingPeriod)),
                Simulation = monthGroup.Count(r => IsInRange(r, request.SimulationPeriod))
            };
            
            breakdown.Add(monthBreakdown);
        }
        
        return breakdown;
    }

    public async Task<int> GetRecordCountInRangeAsync(DateRange dateRange)
    {
        return _dataset.Count(record => IsInRange(record, dateRange));
    }

    public async Task<List<dynamic>> GetRecordsInRangeAsync(DateRange dateRange)
    {
        return _dataset.Where(record => IsInRange(record, dateRange)).ToList();
    }

    private bool HasTimestampColumn()
    {
        if (!_dataset.Any()) return false;
        
        var firstRecord = _dataset.First();
        var properties = ((IDictionary<string, object>)firstRecord).Keys;
        return properties.Any(p => p.ToLower().Contains("timestamp") || p.ToLower().Contains("time"));
    }

    private void AddSyntheticTimestamps()
    {
        var startDate = DateTime.Parse("2021-01-01 00:00:00");
        var timestampedDataset = new List<dynamic>();
        
        foreach (var record in _dataset)
        {
            var recordDict = (IDictionary<string, object>)record;
            var newRecord = new Dictionary<string, object>(recordDict)
            {
                ["synthetic_timestamp"] = startDate.ToString("yyyy-MM-dd HH:mm:ss")
            };
            
            timestampedDataset.Add(newRecord);
            startDate = startDate.AddSeconds(1);
        }
        
        _dataset = timestampedDataset;
    }

    private int GetColumnCount()
    {
        if (!_dataset.Any()) return 0;
        var firstRecord = _dataset.First();
        return ((IDictionary<string, object>)firstRecord).Count;
    }

    private double CalculatePassRate()
    {
        if (!_dataset.Any()) return 0;
        
        var passCount = _dataset.Count(record => 
        {
            var recordDict = (IDictionary<string, object>)record;
            return recordDict.ContainsKey("Response") && 
                   recordDict["Response"]?.ToString() == "1";
        });
        
        return (double)passCount / _dataset.Count * 100;
    }

    private DateRange GetDateRange()
    {
        if (!_dataset.Any()) return new DateRange();
        
        var timestamps = _dataset.Select(record =>
        {
            var recordDict = (IDictionary<string, object>)record;
            var timestamp = recordDict.ContainsKey("synthetic_timestamp") 
                ? recordDict["synthetic_timestamp"]?.ToString() 
                : recordDict.Values.FirstOrDefault()?.ToString();
            
            return DateTime.TryParse(timestamp, out var dt) ? dt : DateTime.MinValue;
        }).Where(dt => dt != DateTime.MinValue).ToList();
        
        if (!timestamps.Any()) return new DateRange();
        
        return new DateRange
        {
            Start = timestamps.Min().ToString("yyyy-MM-dd"),
            End = timestamps.Max().ToString("yyyy-MM-dd")
        };
    }

    private bool ValidateDateLogic(DateRangeRequest request)
    {
        if (!DateTime.TryParse(request.TrainingPeriod.Start, out var trainStart) ||
            !DateTime.TryParse(request.TrainingPeriod.End, out var trainEnd) ||
            !DateTime.TryParse(request.TestingPeriod.Start, out var testStart) ||
            !DateTime.TryParse(request.TestingPeriod.End, out var testEnd) ||
            !DateTime.TryParse(request.SimulationPeriod.Start, out var simStart) ||
            !DateTime.TryParse(request.SimulationPeriod.End, out var simEnd))
        {
            return false;
        }
        
        // Check sequential order
        return trainStart <= trainEnd &&
               trainEnd <= testStart &&
               testStart <= testEnd &&
               testEnd <= simStart &&
               simStart <= simEnd;
    }

    private string GetMonthFromRecord(dynamic record)
    {
        var recordDict = (IDictionary<string, object>)record;
        var timestamp = recordDict.ContainsKey("synthetic_timestamp") 
            ? recordDict["synthetic_timestamp"]?.ToString() 
            : recordDict.Values.FirstOrDefault()?.ToString();
        
        if (DateTime.TryParse(timestamp, out var dt))
        {
            return dt.ToString("yyyy-MM");
        }
        
        return "Unknown";
    }

    private bool IsInRange(dynamic record, DateRange dateRange)
    {
        var recordDict = (IDictionary<string, object>)record;
        var timestamp = recordDict.ContainsKey("synthetic_timestamp") 
            ? recordDict["synthetic_timestamp"]?.ToString() 
            : recordDict.Values.FirstOrDefault()?.ToString();
        
        if (!DateTime.TryParse(timestamp, out var recordDate) ||
            !DateTime.TryParse(dateRange.Start, out var rangeStart) ||
            !DateTime.TryParse(dateRange.End, out var rangeEnd))
        {
            return false;
        }
        
        return recordDate >= rangeStart && recordDate <= rangeEnd;
    }
}
