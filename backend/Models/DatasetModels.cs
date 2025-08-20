namespace IntelliInspect.API.Models;

public class DatasetMetadata
{
    public string FileName { get; set; } = string.Empty;
    public int TotalRecords { get; set; }
    public int TotalColumns { get; set; }
    public double PassRate { get; set; }
    public DateRange DateRange { get; set; } = new();
}

public class DateRange
{
    public string Start { get; set; } = string.Empty;
    public string End { get; set; } = string.Empty;
}

public class DateRangeRequest
{
    public DateRange TrainingPeriod { get; set; } = new();
    public DateRange TestingPeriod { get; set; } = new();
    public DateRange SimulationPeriod { get; set; } = new();
}

public class DateRangeValidation
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TrainingRecords { get; set; }
    public int TestingRecords { get; set; }
    public int SimulationRecords { get; set; }
    public List<MonthlyBreakdown> MonthlyBreakdown { get; set; } = new();
}

public class MonthlyBreakdown
{
    public string Month { get; set; } = string.Empty;
    public int Training { get; set; }
    public int Testing { get; set; }
    public int Simulation { get; set; }
}

public class TrainingRequest
{
    public DateRange TrainingPeriod { get; set; } = new();
    public DateRange TestingPeriod { get; set; } = new();
}

public class TrainingMetrics
{
    public double Accuracy { get; set; }
    public double Precision { get; set; }
    public double Recall { get; set; }
    public double F1Score { get; set; }
    public List<double> TrainingLoss { get; set; } = new();
    public List<double> TrainingAccuracy { get; set; } = new();
    public List<int> Epochs { get; set; } = new();
    public ConfusionMatrix ConfusionMatrix { get; set; } = new();
}

public class ConfusionMatrix
{
    public int TruePositives { get; set; }
    public int TrueNegatives { get; set; }
    public int FalsePositives { get; set; }
    public int FalseNegatives { get; set; }
}

public class SimulationRequest
{
    public DateRange SimulationPeriod { get; set; } = new();
}

public class PredictionResult
{
    public string Timestamp { get; set; } = string.Empty;
    public string SampleId { get; set; } = string.Empty;
    public string Prediction { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public double Temperature { get; set; }
    public double Pressure { get; set; }
    public double Humidity { get; set; }
}

public class SimulationCount
{
    public int TotalRecords { get; set; }
}
