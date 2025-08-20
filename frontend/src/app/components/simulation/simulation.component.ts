import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Chart } from 'chart.js';
import { interval, Subscription } from 'rxjs';

interface PredictionResult {
  timestamp: string;
  sampleId: string;
  prediction: 'Pass' | 'Fail';
  confidence: number;
  temperature: number;
  pressure: number;
  humidity: number;
}

interface SimulationStats {
  totalPredictions: number;
  passCount: number;
  failCount: number;
  averageConfidence: number;
}

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="simulation-container">
      <div class="row justify-content-center">
        <div class="col-lg-12">
          <!-- Simulation Control -->
          <div class="card mb-4">
            <div class="card-header">
              <h4 class="mb-0">
                <i class="fas fa-play-circle me-2"></i>
                Real-Time Prediction Simulation
              </h4>
              <p class="text-muted mb-0">
                Simulate real-time quality control predictions on historical data
              </p>
            </div>
            <div class="card-body text-center">
              <div class="simulation-control" *ngIf="!isSimulating && !isCompleted">
                <div class="control-icon mb-3">
                  <i class="fas fa-rocket fa-4x text-primary"></i>
                </div>
                <h5 class="mb-3">Ready to Simulate</h5>
                <p class="text-muted mb-4">
                  Click the button below to start the real-time prediction simulation.
                  <br>Predictions will stream at 1-second intervals.
                </p>
                <button class="btn btn-primary btn-lg" 
                        (click)="startSimulation()"
                        [disabled]="!canStartSimulation">
                  <i class="fas fa-play me-2"></i>
                  Start Simulation
                </button>
              </div>

              <!-- Simulation Status -->
              <div class="simulation-status" *ngIf="isSimulating">
                <div class="status-icon mb-3">
                  <i class="fas fa-stream fa-3x text-info"></i>
                </div>
                <h5 class="mb-2">Simulation Running</h5>
                <p class="text-muted">Processing predictions in real-time...</p>
                <div class="progress mt-3">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" 
                       role="progressbar" 
                       [style.width.%]="simulationProgress">
                    {{ simulationProgress }}%
                  </div>
                </div>
              </div>

              <!-- Simulation Complete -->
              <div class="simulation-complete" *ngIf="isCompleted">
                <div class="status-icon mb-3">
                  <i class="fas fa-check-circle fa-3x text-success"></i>
                </div>
                <h5 class="mb-2">Simulation Completed</h5>
                <p class="text-muted">All predictions have been processed successfully.</p>
                <button class="btn btn-success btn-lg" 
                        (click)="restartSimulation()">
                  <i class="fas fa-redo me-2"></i>
                  Restart Simulation
                </button>
              </div>
            </div>
          </div>

          <!-- Simulation Results -->
          <div class="row" *ngIf="isSimulating || isCompleted">
            <!-- Statistics Panel -->
            <div class="col-md-3">
              <div class="stats-panel">
                <div class="stat-card total-predictions">
                  <div class="stat-icon">
                    <i class="fas fa-chart-line"></i>
                  </div>
                  <div class="stat-content">
                    <h3 class="stat-value">{{ simulationStats.totalPredictions.toLocaleString() }}</h3>
                    <p class="stat-label">Total Predictions</p>
                  </div>
                </div>

                <div class="stat-card pass-count">
                  <div class="stat-icon">
                    <i class="fas fa-check-circle"></i>
                  </div>
                  <div class="stat-content">
                    <h3 class="stat-value">{{ simulationStats.passCount.toLocaleString() }}</h3>
                    <p class="stat-label">Pass Count</p>
                  </div>
                </div>

                <div class="stat-card fail-count">
                  <div class="stat-icon">
                    <i class="fas fa-times-circle"></i>
                  </div>
                  <div class="stat-content">
                    <h3 class="stat-value">{{ simulationStats.failCount.toLocaleString() }}</h3>
                    <p class="stat-label">Fail Count</p>
                  </div>
                </div>

                <div class="stat-card avg-confidence">
                  <div class="stat-icon">
                    <i class="fas fa-percentage"></i>
                  </div>
                  <div class="stat-content">
                    <h3 class="stat-value">{{ simulationStats.averageConfidence.toFixed(1) }}%</h3>
                    <p class="stat-label">Avg Confidence</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Charts -->
            <div class="col-md-9">
              <div class="row">
                <div class="col-md-6">
                  <div class="chart-card">
                    <h6 class="chart-title">Quality Predictions Over Time</h6>
                    <div class="chart-container">
                      <canvas #qualityChart></canvas>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="chart-card">
                    <h6 class="chart-title">Prediction Confidence Distribution</h6>
                    <div class="chart-container">
                      <canvas #confidenceChart></canvas>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Live Prediction Stream -->
          <div class="card mt-4" *ngIf="isSimulating || isCompleted">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="fas fa-stream me-2"></i>
                Live Prediction Stream
              </h6>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Sample ID</th>
                      <th>Prediction</th>
                      <th>Confidence</th>
                      <th>Temperature (°C)</th>
                      <th>Pressure (hPa)</th>
                      <th>Humidity (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let prediction of predictionStream" 
                        [class.table-success]="prediction.prediction === 'Pass'"
                        [class.table-danger]="prediction.prediction === 'Fail'">
                      <td>{{ prediction.timestamp | date:'HH:mm:ss' }}</td>
                      <td>{{ prediction.sampleId }}</td>
                      <td>
                        <span class="badge" 
                              [class.bg-success]="prediction.prediction === 'Pass'"
                              [class.bg-danger]="prediction.prediction === 'Fail'">
                          {{ prediction.prediction }}
                        </span>
                      </td>
                      <td>{{ prediction.confidence.toFixed(1) }}%</td>
                      <td>{{ prediction.temperature.toFixed(1) }}</td>
                      <td>{{ prediction.pressure.toFixed(1) }}</td>
                      <td>{{ prediction.humidity.toFixed(1) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./simulation.component.css']
})
export class SimulationComponent implements OnInit, OnDestroy {
  @ViewChild('qualityChart') qualityChartRef!: ElementRef;
  @ViewChild('confidenceChart') confidenceChartRef!: ElementRef;

  isSimulating = false;
  isCompleted = false;
  canStartSimulation = false;
  simulationProgress = 0;
  simulationStats: SimulationStats = {
    totalPredictions: 0,
    passCount: 0,
    failCount: 0,
    averageConfidence: 0
  };
  predictionStream: PredictionResult[] = [];
  
  private qualityChart: Chart | null = null;
  private confidenceChart: Chart | null = null;
  private simulationSubscription: Subscription | null = null;
  private totalRecords = 0;
  private processedRecords = 0;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkPrerequisites();
  }

  ngOnDestroy(): void {
    if (this.simulationSubscription) {
      this.simulationSubscription.unsubscribe();
    }
  }

  private checkPrerequisites(): void {
    const hasDataset = sessionStorage.getItem('datasetMetadata');
    const hasDateRanges = sessionStorage.getItem('dateRanges');
    const hasTrainingMetrics = sessionStorage.getItem('trainingMetrics');
    
    this.canStartSimulation = !!(hasDataset && hasDateRanges && hasTrainingMetrics);
    
    if (!this.canStartSimulation) {
      alert('Please complete the previous steps first: upload dataset, configure date ranges, and train model.');
      this.router.navigate(['/upload']);
    }
  }

  startSimulation(): void {
    const dateRanges = sessionStorage.getItem('dateRanges');
    if (!dateRanges) return;

    this.isSimulating = true;
    this.simulationProgress = 0;
    this.predictionStream = [];
    this.resetStats();

    const payload = JSON.parse(dateRanges);
    
    // Get simulation period data count
    this.http.post<{ totalRecords: number }>('http://localhost:5000/api/simulation/get-count', payload)
      .subscribe({
        next: (response) => {
          this.totalRecords = response.totalRecords;
          this.startStreamingSimulation(payload);
        },
        error: (error) => {
          console.error('Error getting simulation count:', error);
          this.isSimulating = false;
        }
      });
  }

  private startStreamingSimulation(payload: any): void {
    // Start streaming predictions at 1-second intervals
    this.simulationSubscription = interval(1000).subscribe(() => {
      if (this.processedRecords >= this.totalRecords) {
        this.completeSimulation();
        return;
      }

      this.processNextPrediction(payload);
    });
  }

  private processNextPrediction(payload: any): void {
    this.http.post<PredictionResult>('http://localhost:5000/api/simulation/predict-next', payload)
      .subscribe({
        next: (prediction) => {
          this.predictionStream.unshift(prediction);
          
          // Keep only last 100 predictions for display
          if (this.predictionStream.length > 100) {
            this.predictionStream = this.predictionStream.slice(0, 100);
          }

          this.updateStats(prediction);
          this.updateCharts();
          
          this.processedRecords++;
          this.simulationProgress = Math.round((this.processedRecords / this.totalRecords) * 100);
        },
        error: (error) => {
          console.error('Prediction error:', error);
          this.processedRecords++;
        }
      });
  }

  private updateStats(prediction: PredictionResult): void {
    this.simulationStats.totalPredictions++;
    
    if (prediction.prediction === 'Pass') {
      this.simulationStats.passCount++;
    } else {
      this.simulationStats.failCount++;
    }

    // Update average confidence
    const totalConfidence = this.predictionStream.reduce((sum, p) => sum + p.confidence, 0);
    this.simulationStats.averageConfidence = totalConfidence / this.simulationStats.totalPredictions;
  }

  private updateCharts(): void {
    if (!this.qualityChart || !this.confidenceChart) return;

    // Update quality chart with new data point
    const labels = this.predictionStream.map((_, index) => `T${this.predictionStream.length - index}`);
    const qualityData = this.predictionStream.map(p => p.prediction === 'Pass' ? 100 : 0);
    
    this.qualityChart.data.labels = labels.slice(-50); // Show last 50 points
    this.qualityChart.data.datasets[0].data = qualityData.slice(-50);
    this.qualityChart.update('none');

    // Update confidence chart
    const passCount = this.simulationStats.passCount;
    const failCount = this.simulationStats.failCount;
    
    this.confidenceChart.data.datasets[0].data = [passCount, failCount];
    this.confidenceChart.update('none');
  }

  private completeSimulation(): void {
    this.isSimulating = false;
    this.isCompleted = true;
    this.simulationProgress = 100;
    
    if (this.simulationSubscription) {
      this.simulationSubscription.unsubscribe();
    }
  }

  private resetStats(): void {
    this.simulationStats = {
      totalPredictions: 0,
      passCount: 0,
      failCount: 0,
      averageConfidence: 0
    };
  }

  restartSimulation(): void {
    this.isCompleted = false;
    this.simulationProgress = 0;
    this.processedRecords = 0;
    this.predictionStream = [];
    this.resetStats();
    this.startSimulation();
  }

  private initializeCharts(): void {
    // Quality Chart
    const qualityCtx = this.qualityChartRef.nativeElement.getContext('2d');
    this.qualityChart = new Chart(qualityCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Quality Score',
          data: [],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Quality Score'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Time'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });

    // Confidence Chart
    const confidenceCtx = this.confidenceChartRef.nativeElement.getContext('2d');
    this.confidenceChart = new Chart(confidenceCtx, {
      type: 'doughnut',
      data: {
        labels: ['Pass', 'Fail'],
        datasets: [{
          data: [0, 0],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          }
        }
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }
}
