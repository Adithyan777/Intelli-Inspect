import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface DateRange {
  start: string;
  end: string;
}

interface DateRangeValidation {
  isValid: boolean;
  message: string;
  trainingRecords: number;
  testingRecords: number;
  simulationRecords: number;
  monthlyBreakdown: Array<{
    month: string;
    training: number;
    testing: number;
    simulation: number;
  }>;
}

@Component({
  selector: 'app-date-ranges',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="date-ranges-container">
      <div class="row justify-content-center">
        <div class="col-lg-10">
          <div class="card">
            <div class="card-header">
              <h4 class="mb-0">
                <i class="fas fa-calendar-alt me-2"></i>
                Configure Date Ranges
              </h4>
              <p class="text-muted mb-0">
                Define time-based splits for training, testing, and simulation periods
              </p>
            </div>
            <div class="card-body">
              <form (ngSubmit)="validateRanges()" #dateForm="ngForm">
                <div class="row">
                  <!-- Training Period -->
                  <div class="col-md-4">
                    <div class="period-card training-card">
                      <div class="period-header">
                        <i class="fas fa-graduation-cap text-success"></i>
                        <h6>Training Period</h6>
                      </div>
                      <div class="form-group">
                        <label>Start Date</label>
                        <input type="date" 
                               class="form-control" 
                               [(ngModel)]="trainingPeriod.start"
                               name="trainingStart"
                               required>
                      </div>
                      <div class="form-group">
                        <label>End Date</label>
                        <input type="date" 
                               class="form-control" 
                               [(ngModel)]="trainingPeriod.end"
                               name="trainingEnd"
                               required>
                      </div>
                    </div>
                  </div>

                  <!-- Testing Period -->
                  <div class="col-md-4">
                    <div class="period-card testing-card">
                      <div class="period-header">
                        <i class="fas fa-vial text-warning"></i>
                        <h6>Testing Period</h6>
                      </div>
                      <div class="form-group">
                        <label>Start Date</label>
                        <input type="date" 
                               class="form-control" 
                               [(ngModel)]="testingPeriod.start"
                               name="testingStart"
                               required>
                      </div>
                      <div class="form-group">
                        <label>End Date</label>
                        <input type="date" 
                               class="form-control" 
                               [(ngModel)]="testingPeriod.end"
                               name="testingEnd"
                               required>
                      </div>
                    </div>
                  </div>

                  <!-- Simulation Period -->
                  <div class="col-md-4">
                    <div class="period-card simulation-card">
                      <div class="period-header">
                        <i class="fas fa-play-circle text-info"></i>
                        <h6>Simulation Period</h6>
                      </div>
                      <div class="form-group">
                        <label>Start Date</label>
                        <input type="date" 
                               class="form-control" 
                               [(ngModel)]="simulationPeriod.start"
                               name="simulationStart"
                               required>
                      </div>
                      <div class="form-group">
                        <label>End Date</label>
                        <input type="date" 
                               class="form-control" 
                               [(ngModel)]="simulationPeriod.end"
                               name="simulationEnd"
                               required>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="text-center mt-4">
                  <button type="submit" 
                          class="btn btn-primary btn-lg"
                          [disabled]="!dateForm.form.valid || isProcessing">
                    <i class="fas fa-check me-2"></i>
                    {{ isProcessing ? 'Validating...' : 'Validate Ranges' }}
                  </button>
                </div>
              </form>

              <!-- Validation Result -->
              <div class="validation-result mt-4" *ngIf="validationResult">
                <div class="alert" 
                     [class.alert-success]="validationResult.isValid"
                     [class.alert-danger]="!validationResult.isValid">
                  <div class="d-flex align-items-center">
                    <i class="fas" 
                       [class.fa-check-circle]="validationResult.isValid"
                       [class.fa-exclamation-triangle]="!validationResult.isValid"
                       [class.text-success]="validationResult.isValid"
                       [class.text-danger]="!validationResult.isValid"></i>
                    <span class="ms-2">{{ validationResult.message }}</span>
                  </div>
                </div>
              </div>

              <!-- Range Summary -->
              <div class="range-summary mt-4" *ngIf="validationResult && validationResult.isValid">
                <h5 class="mb-3">Range Summary</h5>
                <div class="row">
                  <div class="col-md-4">
                    <div class="summary-item training-summary">
                      <div class="summary-icon">
                        <i class="fas fa-graduation-cap"></i>
                      </div>
                      <div class="summary-content">
                        <h6>Training Period</h6>
                        <p class="mb-1">{{ getDuration(trainingPeriod) }} days</p>
                        <small class="text-muted">{{ trainingPeriod.start | date:'shortDate' }} - {{ trainingPeriod.end | date:'shortDate' }}</small>
                        <div class="record-count">
                          <span class="badge bg-success">{{ validationResult.trainingRecords.toLocaleString() }} records</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="summary-item testing-summary">
                      <div class="summary-icon">
                        <i class="fas fa-vial"></i>
                      </div>
                      <div class="summary-content">
                        <h6>Testing Period</h6>
                        <p class="mb-1">{{ getDuration(testingPeriod) }} days</p>
                        <small class="text-muted">{{ testingPeriod.start | date:'shortDate' }} - {{ testingPeriod.end | date:'shortDate' }}</small>
                        <div class="record-count">
                          <span class="badge bg-warning">{{ validationResult.testingRecords.toLocaleString() }} records</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="summary-item simulation-summary">
                      <div class="summary-icon">
                        <i class="fas fa-play-circle"></i>
                      </div>
                      <div class="summary-content">
                        <h6>Simulation Period</h6>
                        <p class="mb-1">{{ getDuration(simulationPeriod) }} days</p>
                        <small class="text-muted">{{ simulationPeriod.start | date:'shortDate' }} - {{ simulationPeriod.end | date:'shortDate' }}</small>
                        <div class="record-count">
                          <span class="badge bg-info">{{ validationResult.simulationRecords.toLocaleString() }} records</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Timeline Chart -->
                <div class="timeline-chart mt-4">
                  <h6 class="mb-3">Monthly Data Distribution</h6>
                  <div class="chart-container">
                    <canvas #timelineChart></canvas>
                  </div>
                </div>

                <div class="text-center mt-4">
                  <button class="btn btn-success btn-lg" 
                          (click)="proceedToNextStep()"
                          [disabled]="!validationResult.isValid">
                    <i class="fas fa-arrow-right me-2"></i>
                    Continue to Model Training
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./date-ranges.component.css']
})
export class DateRangesComponent implements OnInit {
  trainingPeriod: DateRange = { start: '', end: '' };
  testingPeriod: DateRange = { start: '', end: '' };
  simulationPeriod: DateRange = { start: '', end: '' };
  validationResult: DateRangeValidation | null = null;
  isProcessing = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDatasetMetadata();
  }

  private loadDatasetMetadata(): void {
    const metadata = sessionStorage.getItem('datasetMetadata');
    if (metadata) {
      const data = JSON.parse(metadata);
      const startDate = new Date(data.dateRange.start);
      const endDate = new Date(data.dateRange.end);
      
      // Set default ranges
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const trainingDays = Math.floor(totalDays * 0.6);
      const testingDays = Math.floor(totalDays * 0.2);
      
      this.trainingPeriod.start = startDate.toISOString().split('T')[0];
      this.trainingPeriod.end = new Date(startDate.getTime() + trainingDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      this.testingPeriod.start = new Date(this.trainingPeriod.end).toISOString().split('T')[0];
      this.testingPeriod.end = new Date(startDate.getTime() + (trainingDays + testingDays) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      this.simulationPeriod.start = new Date(this.testingPeriod.end).toISOString().split('T')[0];
      this.simulationPeriod.end = endDate.toISOString().split('T')[0];
    }
  }

  validateRanges(): void {
    if (!this.trainingPeriod.start || !this.trainingPeriod.end ||
        !this.testingPeriod.start || !this.testingPeriod.end ||
        !this.simulationPeriod.start || !this.simulationPeriod.end) {
      return;
    }

    this.isProcessing = true;

    const payload = {
      trainingPeriod: this.trainingPeriod,
      testingPeriod: this.testingPeriod,
      simulationPeriod: this.simulationPeriod
    };

    this.http.post<DateRangeValidation>('http://localhost:5000/api/dataset/validate-ranges', payload)
      .subscribe({
        next: (result) => {
          this.validationResult = result;
          this.isProcessing = false;
          
          if (result.isValid) {
            // Store validation result for next steps
            sessionStorage.setItem('dateRanges', JSON.stringify(payload));
            sessionStorage.setItem('validationResult', JSON.stringify(result));
          }
        },
        error: (error) => {
          console.error('Validation error:', error);
          this.validationResult = {
            isValid: false,
            message: 'Error validating date ranges. Please try again.',
            trainingRecords: 0,
            testingRecords: 0,
            simulationRecords: 0,
            monthlyBreakdown: []
          };
          this.isProcessing = false;
        }
      });
  }

  getDuration(range: DateRange): number {
    if (!range.start || !range.end) return 0;
    const start = new Date(range.start);
    const end = new Date(range.end);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  proceedToNextStep(): void {
    this.router.navigate(['/training']);
  }
}
