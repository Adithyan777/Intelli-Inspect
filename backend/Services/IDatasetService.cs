using IntelliInspect.API.Models;

namespace IntelliInspect.API.Services;

public interface IDatasetService
{
    Task<DatasetMetadata> ProcessDatasetAsync(IFormFile file);
    Task<DateRangeValidation> ValidateDateRangesAsync(DateRangeRequest request);
    Task<List<MonthlyBreakdown>> GetMonthlyBreakdownAsync(DateRangeRequest request);
    Task<int> GetRecordCountInRangeAsync(DateRange dateRange);
}
