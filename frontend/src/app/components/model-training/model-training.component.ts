import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';

import { Chart, ChartConfiguration, ChartType } from 'chart.js';

interface TrainingMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingLoss: number[];
  trainingAccuracy: number[];
  epochs: number[];
  confusionMatrix: {
    truePositives: number;
    trueNegatives: number;
    falsePositives: number;
    falseNegatives: number;
  };
}

@Component({
  selector: 'app-model-training',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: `
    <div class="training-container">
      <div class="row justify-content-center">
        <div class="col-lg-10">
          <!-- Training Control -->
          <div class="card mb-4">
            <div class="card-header">
              <h4 class="mb-0">
                <i class="fas fa-brain me-2"></i>
                Model Training & Evaluation
              </h4>
              <p class="text-muted mb-0">
                Train your machine learning model using the configured training and testing datasets
              </p>
            </div>
            <div class="card-body text-center">
              <div class="training-status" *ngIf="!trainingMetrics">
                <div class="status-icon mb-3">
                  <i class="fas fa-play-circle fa-4x text-primary"></i>
                </div>
                <h5 class="mb-3">Ready to Train</h5>
                <p class="text-muted mb-4">
                  Click the button below to start training your model with the configured date ranges.
                </p>
                <button class="btn btn-primary btn-lg" 
                        (click)="trainModel()"
                        [disabled]="isTraining">
                  <i class="fas fa-brain me-2"></i>
                  {{ isTraining ? 'Training Model...' : 'Train Model' }}
                </button>
              </div>

              <!-- Training Progress -->
              <div class="training-progress" *ngIf="isTraining">
                <div class="progress-circle mb-3">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Training...</span>
                  </div>
                </div>
                <h5 class="mb-2">Training in Progress</h5>
                <p class="text-muted">Please wait while the model is being trained...</p>
                <div class="progress mt-3">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" 
                       role="progressbar" 
                       style="width: 100%">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Training Results -->
          <div class="card" *ngIf="trainingMetrics">
            <div class="card-header bg-success text-white">
              <h4 class="mb-0">
                <i class="fas fa-check-circle me-2"></i>
                Model Trained Successfully!
              </h4>
            </div>
            <div class="card-body">
              <!-- Metrics Cards -->
              <div class="row mb-4">
                <div class="col-md-3">
                  <div class="metric-card accuracy-card">
                    <div class="metric-icon">
                      <i class="fas fa-bullseye"></i>
                    </div>
                    <div class="metric-content">
                      <h3 class="metric-value">{{ trainingMetrics.accuracy.toFixed(1) }}%</h3>
                      <p class="metric-label">Accuracy</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="metric-card precision-card">
                    <div class="metric-icon">
                      <i class="fas fa-crosshairs"></i>
                    </div>
                    <div class="metric-content">
                      <h3 class="metric-value">{{ trainingMetrics.precision.toFixed(1) }}%</h3>
                      <p class="metric-label">Precision</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="metric-card recall-card">
                    <div class="metric-icon">
                      <i class="fas fa-search"></i>
                    </div>
                    <div class="metric-content">
                      <h3 class="metric-value">{{ trainingMetrics.recall.toFixed(1) }}%</h3>
                      <p class="metric-label">Recall</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="metric-card f1-card">
                    <div class="metric-icon">
                      <i class="fas fa-balance-scale"></i>
                    </div>
                    <div class="metric-content">
                      <h3 class="metric-value">{{ trainingMetrics.f1Score.toFixed(1) }}%</h3>
                      <p class="metric-label">F1-Score</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Charts Row -->
              <div class="row">
                <div class="col-md-6">
                  <div class="chart-card">
                    <h6 class="chart-title">Training Progress</h6>
                    <div class="chart-container">
                      <canvas #trainingChart></canvas>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="chart-card">
                    <h6 class="chart-title">Confusion Matrix</h6>
                    <div class="chart-container">
                      <canvas #confusionChart></canvas>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Continue Button -->
              <div class="text-center mt-4">
                <button class="btn btn-success btn-lg" 
                        (click)="proceedToNextStep()">
                  <i class="fas fa-arrow-right me-2"></i>
                  Continue to Simulation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./model-training.component.css']
})
export class ModelTrainingComponent implements OnInit, AfterViewInit {
  @ViewChild('trainingChart') trainingChartRef!: ElementRef;
  @ViewChild('confusionChart') confusionChartRef!: ElementRef;

  isTraining = false;
  trainingMetrics: TrainingMetrics | null = null;
  private trainingChart: Chart | null = null;
  private confusionChart: Chart | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Charts will be initialized after training
  }

  trainModel(): void {
    const dateRanges = sessionStorage.getItem('dateRanges');
    if (!dateRanges) {
      alert('Please configure date ranges first.');
      return;
    }

    this.isTraining = true;

    const payload = JSON.parse(dateRanges);
    
    this.http.post<TrainingMetrics>('http://localhost:8080/api/model/train', payload)
      .subscribe({
        next: (metrics) => {
          this.trainingMetrics = metrics;
          this.isTraining = false;
          
          // Store metrics for simulation
          sessionStorage.setItem('trainingMetrics', JSON.stringify(metrics));
          
          // Initialize charts
          setTimeout(() => {
            this.initializeCharts();
          }, 100);
        },
        error: (error) => {
          console.error('Training error:', error);
          alert('Error training model. Please try again.');
          this.isTraining = false;
        }
      });
  }

  private initializeCharts(): void {
    if (!this.trainingMetrics) return;

    // Training Progress Chart
    const trainingCtx = this.trainingChartRef.nativeElement.getContext('2d');
    this.trainingChart = new Chart(trainingCtx, {
      type: 'line',
      data: {
        labels: this.trainingMetrics.epochs.map(e => `Epoch ${e}`),
        datasets: [
          {
            label: 'Training Accuracy',
            data: this.trainingMetrics.trainingAccuracy,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Training Loss',
            data: this.trainingMetrics.trainingLoss,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Accuracy (%)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Loss'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        },
        plugins: {
          legend: {
            position: 'top',
          }
        }
      }
    });

    // Confusion Matrix Chart
    const confusionCtx = this.confusionChartRef.nativeElement.getContext('2d');
    this.confusionChart = new Chart(confusionCtx, {
      type: 'doughnut',
      data: {
        labels: ['True Positives', 'True Negatives', 'False Positives', 'False Negatives'],
        datasets: [{
          data: [
            this.trainingMetrics.confusionMatrix.truePositives,
            this.trainingMetrics.confusionMatrix.trueNegatives,
            this.trainingMetrics.confusionMatrix.falsePositives,
            this.trainingMetrics.confusionMatrix.falseNegatives
          ],
          backgroundColor: [
            '#10b981', // Green for TP
            '#3b82f6', // Blue for TN
            '#f59e0b', // Orange for FP
            '#ef4444'  // Red for FN
          ],
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
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  proceedToNextStep(): void {
    this.router.navigate(['/simulation']);
  }
}
