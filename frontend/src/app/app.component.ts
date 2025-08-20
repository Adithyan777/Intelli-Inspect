import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-container">
      <!-- Header -->
      <header class="app-header">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-md-6">
              <h1 class="app-title">
                <i class="fas fa-robot text-primary me-2"></i>
                IntelliInspect
              </h1>
              <p class="app-subtitle">Real-Time Predictive Quality Control</p>
            </div>
            <div class="col-md-6 text-end">
              <div class="step-indicator">
                <span class="step-label">Step {{ currentStep }} of 4</span>
                <div class="step-progress">
                  <div class="step-bar" [style.width.%]="(currentStep / 4) * 100"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Navigation -->
      <nav class="app-navigation">
        <div class="container">
          <ul class="nav nav-pills nav-fill">
            <li class="nav-item">
              <a class="nav-link" 
                 [class.active]="currentRoute === '/upload'"
                 routerLink="/upload">
                <i class="fas fa-upload me-2"></i>
                Upload Dataset
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" 
                 [class.active]="currentRoute === '/date-ranges'"
                 routerLink="/date-ranges">
                <i class="fas fa-calendar-alt me-2"></i>
                Date Ranges
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" 
                 [class.active]="currentRoute === '/training'"
                 routerLink="/training">
                <i class="fas fa-brain me-2"></i>
                Model Training
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" 
                 [class.active]="currentRoute === '/simulation'"
                 routerLink="/simulation">
                <i class="fas fa-play-circle me-2"></i>
                Simulation
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="app-main">
        <div class="container">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  currentRoute: string = '/upload';
  currentStep: number = 1;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
      this.updateCurrentStep();
    });
  }

  private updateCurrentStep(): void {
    switch (this.currentRoute) {
      case '/upload':
        this.currentStep = 1;
        break;
      case '/date-ranges':
        this.currentStep = 2;
        break;
      case '/training':
        this.currentStep = 3;
        break;
      case '/simulation':
        this.currentStep = 4;
        break;
      default:
        this.currentStep = 1;
    }
  }
}
