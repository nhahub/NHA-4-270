import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper" [class]="type()">
      @if (type() === 'table') {
        <div class="table-skeleton">
          <div class="skeleton-header"></div>
          @for (row of [1, 2, 3, 4, 5]; track $index) {
            <div class="skeleton-row">
              <div class="skeleton-col small"></div>
              <div class="skeleton-col large"></div>
              <div class="skeleton-col medium"></div>
              <div class="skeleton-col small"></div>
              <div class="skeleton-col medium"></div>
            </div>
          }
        </div>
      } @else if (type() === 'card') {
        <div class="card-skeleton glass-card">
          <div class="skeleton-icon"></div>
          <div class="skeleton-line title"></div>
          <div class="skeleton-line value"></div>
          <div class="skeleton-line footer"></div>
        </div>
      } @else if (type() === 'chart') {
        <div class="chart-skeleton glass-card">
          <div class="skeleton-line title"></div>
          <div class="skeleton-chart-bar-container">
            @for (bar of [60, 40, 80, 50, 70, 90]; track $index) {
              <div class="skeleton-chart-bar" [style.height.%]="bar"></div>
            }
          </div>
        </div>
      } @else if (type() === 'list') {
        <div class="list-skeleton">
          @for (item of [1, 2, 3]; track $index) {
            <div class="skeleton-item">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-item-lines">
                <div class="skeleton-line title"></div>
                <div class="skeleton-line subtitle"></div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      width: 100%;
    }
    
    // Shimmer effect keyframe
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    .skeleton-header,
    .skeleton-col,
    .skeleton-icon,
    .skeleton-line,
    .skeleton-chart-bar,
    .skeleton-avatar {
      background: linear-gradient(90deg, 
        rgba(226, 232, 240, 0.4) 25%, 
        rgba(203, 213, 225, 0.6) 50%, 
        rgba(226, 232, 240, 0.4) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    body.dark-theme {
      .skeleton-header,
      .skeleton-col,
      .skeleton-icon,
      .skeleton-line,
      .skeleton-chart-bar,
      .skeleton-avatar {
        background: linear-gradient(90deg, 
          rgba(30, 41, 59, 0.4) 25%, 
          rgba(51, 65, 85, 0.6) 50%, 
          rgba(30, 41, 59, 0.4) 75%
        );
        background-size: 200% 100%;
      }
    }

    // Table Skeleton styling
    .table-skeleton {
      padding: 1.5rem;
      background: var(--surface-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      
      .skeleton-header {
        height: 40px;
        margin-bottom: 1.5rem;
        width: 100%;
      }
      
      .skeleton-row {
        display: flex;
        gap: 1rem;
        height: 50px;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
        
        &:last-child {
          border-bottom: none;
        }
        
        .skeleton-col {
          height: 16px;
          
          &.small { flex: 1; }
          &.medium { flex: 2; }
          &.large { flex: 3; }
        }
      }
    }

    // Card Skeleton styling
    .card-skeleton {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      height: 160px;
      
      .skeleton-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
      }
      
      .skeleton-line {
        height: 12px;
        
        &.title { width: 40%; }
        &.value { height: 24px; width: 60%; }
        &.footer { width: 50%; height: 8px; margin-top: auto; }
      }
    }

    // Chart Skeleton styling
    .chart-skeleton {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      height: 350px;
      
      .skeleton-line.title {
        height: 16px;
        width: 30%;
      }
      
      .skeleton-chart-bar-container {
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        flex: 1;
        gap: 1rem;
        height: calc(100% - 40px);
        
        .skeleton-chart-bar {
          width: 30px;
          border-radius: 4px 4px 0 0;
        }
      }
    }

    // List Skeleton styling
    .list-skeleton {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      
      .skeleton-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: var(--surface-card);
        
        .skeleton-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }
        
        .skeleton-item-lines {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
          
          .skeleton-line {
            height: 10px;
            &.title { width: 50%; }
            &.subtitle { width: 30%; }
          }
        }
      }
    }
  `]
})
export class SkeletonLoaderComponent {
  public type = input<'table' | 'card' | 'chart' | 'list'>('card');
}
