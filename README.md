# IntelliInspect - Real-Time Predictive Quality Control

A full-stack AI-powered application for real-time predictive quality control using production line sensor data.

## Architecture

The application consists of three main components:

- **Frontend**: Angular 18+ application with modern UI components
- **Backend**: ASP.NET Core 8 API service
- **ML Service**: Python FastAPI service for machine learning operations

## Features

- **Dataset Upload**: Drag-and-drop CSV file upload with automatic timestamp augmentation
- **Date Range Configuration**: Configure training, testing, and simulation periods
- **Model Training**: Train machine learning models with real-time progress tracking
- **Real-Time Simulation**: Stream predictions at 1-second intervals with live charts
- **Performance Metrics**: Comprehensive evaluation metrics (Accuracy, Precision, Recall, F1-Score)

## Prerequisites

- Docker and Docker Compose
- .NET 8 SDK (for local development)
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd intelliinspect
   ```

2. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:8080
   - ML Service: http://localhost:8000
   - Swagger Documentation: http://localhost:8080/swagger

## Local Development Setup

### Frontend (Angular)

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm start
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### Backend (.NET)

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Restore packages**
   ```bash
   dotnet restore
   ```

3. **Run the application**
   ```bash
   dotnet run
   ```

4. **Build for production**
   ```bash
   dotnet build -c Release
   ```

### ML Service (Python)

1. **Navigate to ml-service directory**
   ```bash
   cd ml-service
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the service**
   ```bash
   python main.py
   ```

## API Endpoints

### Dataset Management
- `POST /api/dataset/upload` - Upload CSV dataset
- `POST /api/dataset/validate-ranges` - Validate date ranges

### Model Training
- `POST /api/model/train` - Train machine learning model

### Simulation
- `POST /api/simulation/get-count` - Get simulation record count
- `POST /api/simulation/predict-next` - Get next prediction

## Data Format

The application expects CSV files with the following structure:
- Sensor data columns (e.g., Temperature, Pressure, Humidity)
- `Response` column with binary values (1 = Pass, 0 = Fail)
- Optional timestamp column (will be auto-generated if missing)

## Machine Learning

The ML service uses:
- **Algorithm**: Random Forest Classifier
- **Features**: Sensor readings (Temperature, Pressure, Humidity)
- **Target**: Binary quality classification (Pass/Fail)
- **Evaluation**: Accuracy, Precision, Recall, F1-Score

## Docker Services

- **frontend-angular**: Angular application on port 4200
- **backend-dotnet**: .NET API on port 8080
- **ml-service-python**: Python ML service on port 8000

## Environment Variables

- `ML_SERVICE_URL`: URL for the ML service (default: http://localhost:8000)
- `ASPNETCORE_ENVIRONMENT`: .NET environment (default: Development)
- `API_BASE_URL`: Frontend API base URL (default: http://localhost:8080)

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 4200, 8080, and 8000 are available
2. **Docker build failures**: Check Docker has sufficient memory and disk space
3. **CORS errors**: Verify backend CORS configuration matches frontend URL
4. **ML service connection**: Check ML_SERVICE_URL environment variable

### Logs

View service logs:
```bash
docker-compose logs frontend-angular
docker-compose logs backend-dotnet
docker-compose logs ml-service-python
```

### Reset Environment

Clean up and restart:
```bash
docker-compose down -v
docker-compose up --build
```

## Development Workflow

1. **Make code changes** in respective service directories
2. **Rebuild containers** if needed: `docker-compose up --build`
3. **View logs** for debugging: `docker-compose logs -f <service-name>`
4. **Test endpoints** using Swagger UI or Postman

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
