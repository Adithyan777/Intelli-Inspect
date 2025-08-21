using System.Text.Json.Serialization;

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
    [JsonPropertyName("start")]
    public string Start { get; set; } = string.Empty;
    
    [JsonPropertyName("end")]
    public string End { get; set; } = string.Empty;
}

public class DateRangeRequest
{
    [JsonPropertyName("trainingPeriod")]
    public DateRange TrainingPeriod { get; set; } = new();
    
    [JsonPropertyName("testingPeriod")]
    public DateRange TestingPeriod { get; set; } = new();
    
    [JsonPropertyName("simulationPeriod")]
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
    [JsonPropertyName("trainingPeriod")]
    public DateRange TrainingPeriod { get; set; } = new();
    
    [JsonPropertyName("testingPeriod")]
    public DateRange TestingPeriod { get; set; } = new();
    
    [JsonPropertyName("trainingData")]
    public List<Dictionary<string, object>> TrainingData { get; set; } = new();
    
    [JsonPropertyName("testingData")]
    public List<Dictionary<string, object>> TestingData { get; set; } = new();
}

public class TrainingMetrics
{
    [JsonPropertyName("accuracy")]
    public double Accuracy { get; set; }
    
    [JsonPropertyName("precision")]
    public double Precision { get; set; }
    
    [JsonPropertyName("recall")]
    public double Recall { get; set; }
    
    [JsonPropertyName("f1Score")]
    public double F1Score { get; set; }
    
    [JsonPropertyName("trainingLoss")]
    public List<double> TrainingLoss { get; set; } = new();
    
    [JsonPropertyName("trainingAccuracy")]
    public List<double> TrainingAccuracy { get; set; } = new();
    
    [JsonPropertyName("epochs")]
    public List<int> Epochs { get; set; } = new();
    
    [JsonPropertyName("confusionMatrix")]
    public ConfusionMatrix ConfusionMatrix { get; set; } = new();
}

public class ConfusionMatrix
{
    [JsonPropertyName("truePositives")]
    public int TruePositives { get; set; }
    
    [JsonPropertyName("trueNegatives")]
    public int TrueNegatives { get; set; }
    
    [JsonPropertyName("falsePositives")]
    public int FalsePositives { get; set; }
    
    [JsonPropertyName("falseNegatives")]
    public int FalseNegatives { get; set; }
}

public class SimulationRequest
{
    [JsonPropertyName("simulationPeriod")]
    public DateRange SimulationPeriod { get; set; } = new();
    
    [JsonPropertyName("simulationData")]
    public List<Dictionary<string, object>> SimulationData { get; set; } = new();
}

public class PredictionResult
{
    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = string.Empty;
    
    [JsonPropertyName("sampleId")]
    public string SampleId { get; set; } = string.Empty;
    
    [JsonPropertyName("prediction")]
    public string Prediction { get; set; } = string.Empty;
    
    [JsonPropertyName("confidence")]
    public double Confidence { get; set; }
    
    [JsonPropertyName("temperature")]
    public double Temperature { get; set; }
    
    [JsonPropertyName("pressure")]
    public double Pressure { get; set; }
    
    [JsonPropertyName("humidity")]
    public double Humidity { get; set; }
}

public class SimulationCount
{
    [JsonPropertyName("totalRecords")]
    public int TotalRecords { get; set; }
}
