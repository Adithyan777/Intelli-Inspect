import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';

interface DatasetMetadata {
  fileName: string;
  totalRecords: number;
  totalColumns: number;
  passRate: number;
  dateRange: {
    start: string;
    end: string;
  };
}

@Component({
  selector: 'app-upload-dataset',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="upload-container">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <!-- Upload Card -->
          <div class="card upload-card" *ngIf="!datasetMetadata">
            <div class="card-body text-center p-5">
              <div class="upload-icon mb-4">
                <i class="fas fa-cloud-upload-alt fa-4x text-primary"></i>
              </div>
              
              <h3 class="card-title mb-3">Upload Your Dataset</h3>
              <p class="text-muted mb-4">
                Click to select a CSV file or drag and drop it here.<br>
                The file should contain a 'Response' column for quality classification.
              </p>
              
              <div class="upload-area" 
                   (dragover)="onDragOver($event)"
                   (dragleave)="onDragLeave($event)"
                   (drop)="onDrop($event)"
                   [class.drag-over]="isDragOver"
                   (click)="fileInput.click()">
                <div class="upload-content">
                  <i class="fas fa-file-csv fa-3x text-muted mb-3"></i>
                  <p class="mb-2">Choose File</p>
                  <small class="text-muted">or drag and drop</small>
                </div>
              </div>
              
              <input #fileInput 
                     type="file" 
                     accept=".csv"
                     (change)="onFileSelected($event)"
                     style="display: none;">
              
              <div class="mt-3" *ngIf="uploadProgress > 0 && uploadProgress < 100">
                <div class="progress">
                  <div class="progress-bar" 
                       [style.width.%]="uploadProgress"
                       role="progressbar">
                    {{ uploadProgress }}%
                  </div>
                </div>
                <small class="text-muted">Processing dataset...</small>
              </div>
            </div>
          </div>

          <!-- Dataset Summary Card -->
          <div class="card summary-card" *ngIf="datasetMetadata">
            <div class="card-header bg-success text-white">
              <h4 class="mb-0">
                <i class="fas fa-check-circle me-2"></i>
                Dataset Uploaded Successfully!
              </h4>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6 class="text-muted mb-3">File Information</h6>
                  <div class="file-info">
                    <p><strong>File Name:</strong> 
                      <a href="#" class="text-primary">{{ datasetMetadata.fileName }}</a>
                    </p>
                    <p><strong>Total Records:</strong> 
                      <span class="badge bg-primary">{{ datasetMetadata.totalRecords.toLocaleString() }}</span>
                    </p>
                    <p><strong>Total Columns:</strong> 
                      <span class="badge bg-info">{{ datasetMetadata.totalColumns }}</span>
                    </p>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6 class="text-muted mb-3">Quality Metrics</h6>
                  <div class="quality-metrics">
                    <p><strong>Pass Rate:</strong> 
                      <span class="badge bg-success">{{ datasetMetadata.passRate.toFixed(1) }}%</span>
                    </p>
                    <p><strong>Date Range:</strong></p>
                    <p class="text-muted">
                      {{ datasetMetadata.dateRange.start | date:'mediumDate' }} to 
                      {{ datasetMetadata.dateRange.end | date:'mediumDate' }}
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="text-center mt-4">
                <button class="btn btn-primary btn-lg" 
                        (click)="proceedToNextStep()"
                        [disabled]="!datasetMetadata">
                  <i class="fas fa-arrow-right me-2"></i>
                  Continue to Date Ranges
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./upload-dataset.component.css']
})
export class UploadDatasetComponent implements OnInit {
  isDragOver = false;
  uploadProgress = 0;
  datasetMetadata: DatasetMetadata | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  private processFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file.');
      return;
    }

    this.uploadProgress = 10;
    
    const formData = new FormData();
    formData.append('file', file);

    this.http.post('http://localhost:5000/api/dataset/upload', formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round((event.loaded / event.total) * 100);
        } else if (event instanceof HttpResponse) {
          this.uploadProgress = 100;
          this.datasetMetadata = event.body;
          
          // Store metadata in session storage for next steps
          sessionStorage.setItem('datasetMetadata', JSON.stringify(this.datasetMetadata));
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        alert('Error uploading file. Please try again.');
        this.uploadProgress = 0;
      }
    });
  }

  proceedToNextStep(): void {
    this.router.navigate(['/date-ranges']);
  }
}
