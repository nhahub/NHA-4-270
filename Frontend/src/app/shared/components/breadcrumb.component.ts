import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

interface BreadcrumbItem {
  label: string;
  url: string;
  last: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="breadcrumb-container" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li class="breadcrumb-item">
          <a routerLink="/dashboard" class="breadcrumb-link home">
            <i class="pi pi-home"></i>
            <span>Home</span>
          </a>
        </li>
        @for (item of items(); track item.url) {
          <li class="breadcrumb-separator">
            <i class="pi pi-angle-right"></i>
          </li>
          <li class="breadcrumb-item" [class.active]="item.last">
            @if (item.last) {
              <span class="breadcrumb-active-text">{{ item.label }}</span>
            } @else {
              <a [routerLink]="item.url" class="breadcrumb-link">{{ item.label }}</a>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb-container {
      margin-bottom: 1.5rem;
      padding: 0.25rem 0;
    }
    
    .breadcrumb-list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      list-style: none;
      gap: 0.5rem;
    }
    
    .breadcrumb-item {
      display: flex;
      align-items: center;
      font-size: 0.875rem;
      font-weight: 500;
      
      &.active {
        color: var(--text-color);
        font-weight: 600;
      }
    }
    
    .breadcrumb-separator {
      display: flex;
      align-items: center;
      color: var(--text-secondary);
      font-size: 0.75rem;
      opacity: 0.7;
    }
    
    .breadcrumb-link {
      color: var(--text-secondary);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      transition: color 0.15s ease;
      
      &:hover {
        color: var(--primary-color);
      }
      
      &.home i {
        font-size: 0.9rem;
      }
    }
    
    .breadcrumb-active-text {
      color: var(--text-color);
    }
  `]
})
export class BreadcrumbComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  
  public items = signal<BreadcrumbItem[]>([]);

  public ngOnInit(): void {
    this.generateBreadcrumbs();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.generateBreadcrumbs();
    });
  }

  private generateBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbItem[] = [];
    let currentRoute: ActivatedRoute | null = this.activatedRoute.root;
    let url = '';

    while (currentRoute) {
      const children: ActivatedRoute[] = currentRoute.children;
      currentRoute = null;

      for (const child of children) {
        if (child.outlet === 'primary') {
          const routeParts = child.snapshot.url.map(segment => segment.path);
          if (routeParts.length > 0) {
            url += '/' + routeParts.join('/');
            
            // Generate label
            let label = child.snapshot.data['title'] || routeParts[routeParts.length - 1];
            
            // Format label (e.g. 'stock-movements' to 'Stock Movements')
            if (typeof label === 'string') {
              label = label
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }

            breadcrumbs.push({
              label,
              url,
              last: false
            });
          }
          currentRoute = child;
        }
      }
    }

    if (breadcrumbs.length > 0) {
      breadcrumbs[breadcrumbs.length - 1].last = true;
    }

    // Filter out redundant 'Dashboard' breadcrumb step if user is already at home
    const filtered = breadcrumbs.filter((item, index) => {
      if (item.url === '/dashboard' && index === 0 && breadcrumbs.length > 1) {
        return false;
      }
      return true;
    });

    this.items.set(filtered);
  }
}
