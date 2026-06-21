import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="error-state-container glass-card fade-in">
      <div class="icon-wrapper">
        <i class="pi pi-exclamation-triangle"></i>
      </div>
      <h3>Operation Failed</h3>
      <p>{{ message() }}</p>
      <button pButton 
              [label]="retryLabel()" 
              icon="pi pi-refresh" 
              class="p-button-danger p-button-outlined mt-3" 
              (click)="retry.emit()">
      </button>
    </div>
  `,
  styles: [`
    .error-state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 2rem;
      max-width: 500px;
      margin: 2rem auto;
      border-color: rgba(239, 68, 68, 0.3) !important;
      
      h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--danger-color);
      }
      
      p {
        font-size: 0.875rem;
        color: var(--text-secondary);
        max-width: 320px;
        line-height: 1.5;
        margin-bottom: 1rem;
      }
    }
    
    .icon-wrapper {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(239, 68, 68, 0.15);
      
      i {
        font-size: 2rem;
        color: var(--danger-color);
      }
    }

    body.dark-theme {
      .icon-wrapper {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.3);
      }
    }
  `]
})
export class ErrorStateComponent {
  public message = input<string>('An error occurred while communicating with the server.');
  public retryLabel = input<string>('Retry Connection');
  
  public retry = output<void>();
}
