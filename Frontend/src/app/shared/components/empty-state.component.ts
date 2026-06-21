import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="empty-state-container glass-card fade-in">
      <div class="icon-wrapper">
        <i [class]="icon()"></i>
      </div>
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
      @if (actionLabel()) {
        <button pButton 
                [label]="actionLabel()!" 
                icon="pi pi-plus" 
                class="p-button-primary mt-3" 
                (click)="actionClicked.emit()">
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 2rem;
      max-width: 500px;
      margin: 2rem auto;
      
      h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: var(--text-color);
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
      background: rgba(37, 99, 235, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(37, 99, 235, 0.15);
      
      i {
        font-size: 2rem;
        color: var(--primary-color);
      }
    }

    body.dark-theme {
      .icon-wrapper {
        background: rgba(37, 99, 235, 0.15);
        border-color: rgba(37, 99, 235, 0.3);
      }
    }
  `]
})
export class EmptyStateComponent {
  public title = input<string>('No Data Found');
  public description = input<string>('There are no items to display at the moment.');
  public icon = input<string>('pi pi-folder-open');
  public actionLabel = input<string | null>(null);
  
  public actionClicked = output<void>();
}
