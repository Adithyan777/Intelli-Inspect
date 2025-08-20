using IntelliInspect.API.Services;
using IntelliInspect.API.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add HTTP client for ML service
builder.Services.AddHttpClient<IMLService, MLService>(client =>
{
    var mlServiceUrl = Environment.GetEnvironmentVariable("ML_SERVICE_URL") ?? "http://localhost:8000";
    client.BaseAddress = new Uri(mlServiceUrl);
});

// Add singleton services
builder.Services.AddSingleton<IDatasetService, DatasetService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();
