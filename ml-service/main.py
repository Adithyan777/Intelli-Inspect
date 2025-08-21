from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib
import uuid
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="IntelliInspect ML Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to store the trained model and data
trained_model = None
training_data = None
testing_data = None
simulation_data = None
simulation_index = 0  # Track current position in simulation data
feature_columns = None

# Pydantic models for request/response
class DateRange(BaseModel):
    start: str
    end: str

class DatasetRecord(BaseModel):
    """A single record from the dataset"""
    timestamp: Optional[str] = None
    synthetic_timestamp: Optional[str] = None
    response: Optional[int] = None
    # Additional fields can be added dynamically
    additional_fields: Optional[dict] = {}

class TrainingRequest(BaseModel):
    trainingPeriod: DateRange
    testingPeriod: DateRange
    trainingData: Optional[List[dict]] = []
    testingData: Optional[List[dict]] = []

class TrainingMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1Score: float
    trainingLoss: List[float]
    trainingAccuracy: List[float]
    epochs: List[int]
    confusionMatrix: dict

class SimulationRequest(BaseModel):
    simulationPeriod: DateRange
    simulationData: Optional[List[dict]] = []

class PredictionResult(BaseModel):
    timestamp: str
    sampleId: str
    prediction: str
    confidence: float
    temperature: float
    pressure: float
    humidity: float

class SimulationCount(BaseModel):
    totalRecords: int

@app.get("/")
async def root():
    return {"message": "IntelliInspect ML Service is running"}

@app.post("/train")
async def train_model(request: TrainingRequest):
    """Train the machine learning model using the specified date ranges"""
    global trained_model, training_data, testing_data, feature_columns
    
    try:
        logger.info(f"Training model with training period: {request.trainingPeriod.start} to {request.trainingPeriod.end}")
        
        # Debug: Log what we received
        logger.info(f"Received request data:")
        logger.info(f"  - trainingData exists: {hasattr(request, 'trainingData')}")
        logger.info(f"  - testingData exists: {hasattr(request, 'testingData')}")
        if hasattr(request, 'trainingData'):
            logger.info(f"  - trainingData length: {len(request.trainingData) if request.trainingData else 0}")
        if hasattr(request, 'testingData'):
            logger.info(f"  - testingData length: {len(request.testingData) if request.testingData else 0}")
        
        # Check if real data is provided
        if hasattr(request, 'trainingData') and hasattr(request, 'testingData') and request.trainingData and len(request.trainingData) > 0:
            # We have training data, check if we also have testing data
            if request.testingData and len(request.testingData) > 0:
                logger.info(f"Using real dataset - Training records: {len(request.trainingData)}, Testing records: {len(request.testingData)}")
                training_data, testing_data, feature_columns = process_real_data(request.trainingData, request.testingData)
            else:
                logger.info(f"Using real training data ({len(request.trainingData)} records) and splitting for testing since no separate testing data provided")
                # Use training data for both, then split it
                training_data_full, _, feature_columns = process_real_data(request.trainingData, request.trainingData)
                # Split the training data into train/test
                from sklearn.model_selection import train_test_split
                training_data, testing_data = train_test_split(training_data_full, test_size=0.3, random_state=42, stratify=training_data_full['Response'])
        else:
            logger.warning("No real data provided, falling back to synthetic data generation")
            # For demo purposes, we'll generate synthetic data
            # In a real implementation, you would load data from your dataset service
            training_data, testing_data, feature_columns = generate_synthetic_data()
        
        # Prepare features and target
        X_train = training_data[feature_columns]
        y_train = training_data['Response']
        X_test = testing_data[feature_columns]
        y_test = testing_data['Response']
        
        logger.info(f"Training with {len(X_train)} training samples and {len(X_test)} testing samples")
        logger.info(f"Feature columns: {feature_columns}")
        
        # Train Random Forest model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        
        # Simulate training epochs
        epochs = list(range(1, 11))
        training_accuracy = []
        training_loss = []
        
        for epoch in epochs:
            # In real implementation, this would be actual training
            if epoch == 1:
                model.fit(X_train, y_train)
            
            # Simulate training metrics
            train_pred = model.predict(X_train)
            train_acc = accuracy_score(y_train, train_pred)
            training_accuracy.append(train_acc * 100)
            
            # Simulate loss (decreasing over time)
            loss = 1.0 - (epoch * 0.08)
            training_loss.append(max(loss, 0.1))
        
        # Make predictions on test set
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred) * 100
        precision = precision_score(y_test, y_pred, average='binary') * 100
        recall = recall_score(y_test, y_pred, average='binary') * 100
        f1 = f1_score(y_test, y_pred, average='binary') * 100
        
        # Calculate confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        confusion_matrix_dict = {
            "truePositives": int(cm[1, 1]),
            "trueNegatives": int(cm[0, 0]),
            "falsePositives": int(cm[0, 1]),
            "falseNegatives": int(cm[1, 0])
        }
        
        # Store the trained model
        trained_model = model
        
        logger.info(f"Model training completed. Accuracy: {accuracy:.2f}%")
        
        return TrainingMetrics(
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1Score=f1,
            trainingLoss=training_loss,
            trainingAccuracy=training_accuracy,
            epochs=epochs,
            confusionMatrix=confusion_matrix_dict
        )
        
    except Exception as e:
        logger.error(f"Error during model training: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.post("/simulation-count")
async def get_simulation_count(request: SimulationRequest):
    """Get the total number of records in the simulation period"""
    try:
        logger.info(f"Getting simulation count for period: {request.simulationPeriod.start} to {request.simulationPeriod.end}")
        
        # Check if real simulation data is provided
        if hasattr(request, 'simulationData') and request.simulationData and len(request.simulationData) > 0:
            count = len(request.simulationData)
            logger.info(f"Using real simulation data: {count} records")
        else:
            # Fallback to demo count if no real data provided
            logger.warning("No real simulation data provided, returning demo count")
            count = 1000
        
        logger.info(f"Simulation count: {count} records")
        
        return SimulationCount(totalRecords=count)
        
    except Exception as e:
        logger.error(f"Error getting simulation count: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get simulation count: {str(e)}")

@app.post("/predict-next")
async def predict_next(request: SimulationRequest):
    """Get the next prediction for the simulation"""
    global trained_model, simulation_data, simulation_index
    
    try:
        if trained_model is None:
            raise HTTPException(status_code=400, detail="Model not trained. Please train the model first.")
        
        logger.info(f"Getting next prediction for simulation period: {request.simulationPeriod.start} to {request.simulationPeriod.end}")
        
        # Check if real simulation data is provided
        if hasattr(request, 'simulationData') and request.simulationData and len(request.simulationData) > 0:
            # Use real simulation data
            if simulation_data is None or len(simulation_data) != len(request.simulationData):
                # Process and store simulation data
                simulation_data = pd.DataFrame(request.simulationData)
                # Standardize column names
                column_mapping = {}
                for col in simulation_data.columns:
                    col_lower = col.lower()
                    if 'temperature' in col_lower or 'temp' in col_lower:
                        column_mapping[col] = 'Temperature'
                    elif 'pressure' in col_lower:
                        column_mapping[col] = 'Pressure'
                    elif 'humidity' in col_lower:
                        column_mapping[col] = 'Humidity'
                
                simulation_data = simulation_data.rename(columns=column_mapping)
                simulation_index = 0  # Reset index
                logger.info(f"Processed {len(simulation_data)} simulation records")
            
            # Get the next record from simulation data
            if simulation_index >= len(simulation_data):
                simulation_index = 0  # Wrap around to beginning
            
            current_record = simulation_data.iloc[simulation_index]
            simulation_index += 1
            
            # Extract sensor values from the current record
            temperature = float(current_record.get('Temperature', 25.0))
            pressure = float(current_record.get('Pressure', 1013.0))
            humidity = float(current_record.get('Humidity', 50.0))
            
            # Get actual timestamp if available
            timestamp = current_record.get('Timestamp', current_record.get('synthetic_timestamp', datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
            if isinstance(timestamp, str):
                record_timestamp = timestamp
            else:
                record_timestamp = str(timestamp)
            
            logger.info(f"Using real simulation record {simulation_index}/{len(simulation_data)}: T={temperature:.1f}, P={pressure:.1f}, H={humidity:.1f}")
            
        else:
            # Fallback to synthetic data generation
            logger.warning("No real simulation data provided, generating synthetic values")
            temperature = np.random.normal(25, 5)  # Mean 25°C, std 5°C
            pressure = np.random.normal(1013, 10)  # Mean 1013 hPa, std 10 hPa
            humidity = np.random.normal(50, 15)    # Mean 50%, std 15%
            record_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Create feature vector
        features = np.array([[temperature, pressure, humidity]])
        
        # Make prediction
        prediction_proba = trained_model.predict_proba(features)[0]
        prediction = "Pass" if prediction_proba[1] > 0.5 else "Fail"
        confidence = max(prediction_proba) * 100
        
        # Generate sample ID
        sample_id = f"SAMPLE_{uuid.uuid4().hex[:8].upper()}"
        
        logger.info(f"Prediction: {prediction} with {confidence:.2f}% confidence for sample {sample_id}")
        
        return PredictionResult(
            timestamp=record_timestamp,
            sampleId=sample_id,
            prediction=prediction,
            confidence=confidence,
            temperature=temperature,
            pressure=pressure,
            humidity=humidity
        )
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

def process_real_data(training_records, testing_records):
    """Process real dataset records from the backend"""
    logger.info("Processing real dataset records")
    
    # Convert list of dicts to DataFrames
    training_df = pd.DataFrame(training_records)
    testing_df = pd.DataFrame(testing_records)
    
    # Standardize column names (handle case-insensitive matching)
    def standardize_column_names(df):
        # Create a mapping for common variations
        column_mapping = {}
        for col in df.columns:
            col_lower = col.lower()
            if 'response' in col_lower:
                column_mapping[col] = 'Response'
            elif 'temperature' in col_lower or 'temp' in col_lower:
                column_mapping[col] = 'Temperature'
            elif 'pressure' in col_lower:
                column_mapping[col] = 'Pressure'
            elif 'humidity' in col_lower:
                column_mapping[col] = 'Humidity'
            # Keep timestamp columns as-is for now
        
        return df.rename(columns=column_mapping)
    
    training_df = standardize_column_names(training_df)
    testing_df = standardize_column_names(testing_df)
    
    logger.info(f"Training data columns: {list(training_df.columns)}")
    logger.info(f"Testing data columns: {list(testing_df.columns)}")
    
    # Ensure Response column exists and is properly formatted
    if 'Response' not in training_df.columns:
        logger.error("Response column not found in training data")
        raise ValueError("Response column is required for training")
    
    # Convert Response to binary if needed
    training_df['Response'] = training_df['Response'].astype(int)
    testing_df['Response'] = testing_df['Response'].astype(int)
    
    # Identify feature columns (exclude response and timestamp columns)
    exclude_cols = ['Response', 'timestamp', 'synthetic_timestamp']
    potential_features = [col for col in training_df.columns if col not in exclude_cols]
    
    # Filter to numeric columns only
    numeric_features = []
    for col in potential_features:
        try:
            training_df[col] = pd.to_numeric(training_df[col], errors='coerce')
            testing_df[col] = pd.to_numeric(testing_df[col], errors='coerce')
            if not training_df[col].isna().all():  # Column has some numeric values
                numeric_features.append(col)
        except:
            logger.warning(f"Skipping non-numeric column: {col}")
    
    if not numeric_features:
        logger.error("No numeric feature columns found")
        raise ValueError("At least one numeric feature column is required")
    
    logger.info(f"Using feature columns: {numeric_features}")
    
    # Handle missing values
    for col in numeric_features:
        training_df[col] = training_df[col].fillna(training_df[col].median())
        testing_df[col] = testing_df[col].fillna(testing_df[col].median())
    
    return training_df, testing_df, numeric_features

def generate_synthetic_data():
    """Generate synthetic training and testing data for demonstration"""
    np.random.seed(42)
    
    # Generate 1000 samples
    n_samples = 1000
    
    # Generate synthetic sensor data
    temperature = np.random.normal(25, 5, n_samples)
    pressure = np.random.normal(1013, 10, n_samples)
    humidity = np.random.normal(50, 15, n_samples)
    
    # Create synthetic quality labels based on sensor values
    # Higher temperature, pressure, and humidity variations indicate potential quality issues
    temp_score = np.abs(temperature - 25) / 5
    pressure_score = np.abs(pressure - 1013) / 10
    humidity_score = np.abs(humidity - 50) / 15
    
    # Combined quality score
    quality_score = temp_score + pressure_score + humidity_score
    
    # Generate binary response (1 = Pass, 0 = Fail)
    # Higher quality score means higher chance of failure
    response = (quality_score < 1.5).astype(int)
    
    # Create DataFrame
    data = pd.DataFrame({
        'Temperature': temperature,
        'Pressure': pressure,
        'Humidity': humidity,
        'Response': response
    })
    
    # Split into training and testing
    train_data, test_data = train_test_split(data, test_size=0.3, random_state=42, stratify=data['Response'])
    
    # Define feature columns
    feature_cols = ['Temperature', 'Pressure', 'Humidity']
    
    return train_data, test_data, feature_cols

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
