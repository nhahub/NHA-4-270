import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, NavbarComponent, FooterComponent],
  template: `
    <div class="layout-wrapper" 
         [class.sidebar-collapsed]="isCollapsed()" 
         [class.mobile-sidebar-active]="isMobileOpen()">
      
      <!-- Collapsible Sidebar -->
      <app-sidebar [collapsed]="isCollapsed()" [mobileOpen]="isMobileOpen()"></app-sidebar>
      
      <!-- Backdrop overlay for mobile menu -->
      @if (isMobileOpen()) {
        <div class="mobile-overlay fade-in" (click)="closeMobileSidebar()"></div>
      }
      
      <!-- Main Content Layout Section -->
      <div class="main-panel">
        <app-navbar 
          (toggleSidebar)="toggleSidebar()" 
          (toggleMobileSidebar)="toggleMobileSidebar()">
        </app-navbar>
        
        <main class="page-viewport">
          <div class="page-content">
            <router-outlet></router-outlet>
          </div>
        </main>
        
        <app-footer></app-footer>
      </div>
    </div>
  `,
  styles: [`
    .layout-wrapper {
      display: flex;
      min-height: 100vh;
      flex-direction: row;
      position: relative;
    }
    
    .mobile-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      z-index: 99;
    }

    .main-panel {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      margin-left: 260px;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .layout-wrapper.sidebar-collapsed .main-panel {
      margin-left: 78px;
    }
    
    .page-viewport {
      flex: 1;
      padding: 1.5rem;
      background: var(--bg-color);
      display: flex;
      flex-direction: column;
    }
    
    .page-content {
      flex: 1;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }

    @media (max-width: 991px) {
      .main-panel {
        margin-left: 0 !important;
      }
      
      .page-viewport {
        padding: 1rem;
      }
    }
  `]
})
export class ShellComponent {
  public isCollapsed = signal<boolean>(false);
  public isMobileOpen = signal<boolean>(false);

  public toggleSidebar(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  public toggleMobileSidebar(): void {
    this.isMobileOpen.set(!this.isMobileOpen());
  }

  public closeMobileSidebar(): void {
    this.isMobileOpen.set(false);
  }
}
