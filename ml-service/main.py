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
feature_columns = None

# Pydantic models for request/response
class DateRange(BaseModel):
    start: str
    end: str

class TrainingRequest(BaseModel):
    trainingPeriod: DateRange
    testingPeriod: DateRange

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
        
        # For demo purposes, we'll generate synthetic data
        # In a real implementation, you would load data from your dataset service
        training_data, testing_data, feature_columns = generate_synthetic_data()
        
        # Prepare features and target
        X_train = training_data[feature_columns]
        y_train = training_data['Response']
        X_test = testing_data[feature_columns]
        y_test = testing_data['Response']
        
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
        
        # For demo purposes, return a fixed count
        # In real implementation, you would query your dataset service
        count = 1000
        
        logger.info(f"Simulation count: {count} records")
        
        return SimulationCount(totalRecords=count)
        
    except Exception as e:
        logger.error(f"Error getting simulation count: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get simulation count: {str(e)}")

@app.post("/predict-next")
async def predict_next(request: SimulationRequest):
    """Get the next prediction for the simulation"""
    global trained_model, simulation_data
    
    try:
        if trained_model is None:
            raise HTTPException(status_code=400, detail="Model not trained. Please train the model first.")
        
        logger.info(f"Getting next prediction for simulation period: {request.simulationPeriod.start} to {request.simulationPeriod.end}")
        
        # For demo purposes, generate a synthetic prediction
        # In real implementation, you would get the next record from your dataset service
        
        # Generate random sensor values
        temperature = np.random.normal(25, 5)  # Mean 25°C, std 5°C
        pressure = np.random.normal(1013, 10)  # Mean 1013 hPa, std 10 hPa
        humidity = np.random.normal(50, 15)    # Mean 50%, std 15%
        
        # Create feature vector
        features = np.array([[temperature, pressure, humidity]])
        
        # Make prediction
        prediction_proba = trained_model.predict_proba(features)[0]
        prediction = "Pass" if prediction_proba[1] > 0.5 else "Fail"
        confidence = max(prediction_proba) * 100
        
        # Generate sample ID and timestamp
        sample_id = f"SAMPLE_{uuid.uuid4().hex[:8].upper()}"
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        logger.info(f"Prediction: {prediction} with {confidence:.2f}% confidence for sample {sample_id}")
        
        return PredictionResult(
            timestamp=timestamp,
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
