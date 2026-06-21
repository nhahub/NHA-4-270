import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthStore } from '../../stores/auth.store';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  permission?: string;
  children?: MenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar-container" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
      <!-- Brand Logo Area -->
      <div class="brand-area">
        @if (authStore.tenant(); as tenant) {
          <div class="brand-logo-wrapper">
            @if (tenant.logo) {
              <img [src]="tenant.logo" alt="Tenant Logo" class="brand-logo" />
            } @else {
              <div class="brand-logo-placeholder">
                <i class="pi pi-box"></i>
              </div>
            }
          </div>
          @if (!collapsed()) {
            <div class="brand-info fade-in">
              <span class="brand-name">{{ tenant.name }}</span>
              <span class="brand-subtext">Tenant Portal</span>
            </div>
          }
        }
      </div>

      <!-- Navigation Menu -->
      <nav class="nav-menu">
        <ul class="nav-list">
          @for (item of menuItems; track item.label) {
            @if (!item.permission || authStore.hasPermission(item.permission)) {
              <li class="nav-item">
                @if (item.route) {
                  <!-- Standard Link -->
                  <a [routerLink]="item.route" 
                     routerLinkActive="active" 
                     [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
                     class="nav-link" 
                     [title]="item.label">
                    <i [class]="item.icon + ' nav-icon'"></i>
                    @if (!collapsed()) {
                      <span class="nav-text fade-in">{{ item.label }}</span>
                    }
                  </a>
                } @else if (item.children) {
                  <!-- Group Header / Collapsible (Always shown as links or category headers in this simplified theme) -->
                  <div class="menu-category-header" *ngIf="!collapsed()">
                    {{ item.label }}
                  </div>
                  @for (subItem of item.children; track subItem.label) {
                    @if (!subItem.permission || authStore.hasPermission(subItem.permission)) {
                      <a [routerLink]="subItem.route" 
                         routerLinkActive="active" 
                         class="nav-link sub-link" 
                         [title]="subItem.label">
                        <i [class]="subItem.icon + ' nav-icon'"></i>
                        @if (!collapsed()) {
                          <span class="nav-text fade-in">{{ subItem.label }}</span>
                        }
                      </a>
                    }
                  }
                }
              </li>
            }
          }
        </ul>
      </nav>

      <!-- Sidebar Footer (User Info & Logout) -->
      <div class="sidebar-footer">
        <button class="logout-btn" (click)="onLogout()" title="Sign Out">
          <i class="pi pi-sign-out logout-icon"></i>
          @if (!collapsed()) {
            <span class="logout-text fade-in">Logout</span>
          }
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-container {
      width: 260px;
      height: 100vh;
      background: var(--sidebar-bg);
      color: var(--sidebar-text);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
      border-right: 1px solid var(--border-color);
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease;
      
      &.collapsed {
        width: 78px;
        
        .brand-area {
          padding: 1.25rem 0.5rem;
          justify-content: center;
        }
        
        .nav-link {
          justify-content: center;
          padding: 0.75rem 0;
          margin: 0.25rem 0.5rem;
          border-radius: 12px;
          
          .nav-icon {
            margin-right: 0;
            font-size: 1.25rem;
          }
        }

        .logout-btn {
          justify-content: center;
          padding: 0.75rem 0;
          
          .logout-icon {
            margin-right: 0;
            font-size: 1.25rem;
          }
        }
      }
    }

    .brand-area {
      height: 70px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    
    .brand-logo-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      border: 1.5px solid rgba(255, 255, 255, 0.1);
      
      .brand-logo {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .brand-logo-placeholder {
        color: #0f172a;
        font-size: 1.1rem;
      }
    }
    
    .brand-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .brand-name {
      font-size: 0.95rem;
      font-weight: 700;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      color: #ffffff;
    }
    
    .brand-subtext {
      font-size: 0.7rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .nav-menu {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
      overflow-x: hidden;
    }
    
    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .menu-category-header {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.35);
      padding: 1rem 1.5rem 0.5rem 1.5rem;
    }
    
    .nav-link {
      display: flex;
      align-items: center;
      padding: 0.75rem 1.5rem;
      color: rgba(255, 255, 255, 0.75);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;
      margin: 0 0.75rem;
      border-radius: 8px;
      
      .nav-icon {
        margin-right: 0.85rem;
        font-size: 1.1rem;
        transition: transform 0.2s ease;
      }
      
      &:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.05);
        
        .nav-icon {
          transform: scale(1.1);
        }
      }
      
      &.active {
        color: #ffffff;
        background: var(--sidebar-active);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      }
    }
    
    .sub-link {
      padding-left: 1.85rem;
    }

    .sidebar-footer {
      padding: 1rem 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    
    .logout-btn {
      width: 100%;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.6);
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      .logout-icon {
        margin-right: 0.85rem;
        font-size: 1.1rem;
      }
      
      &:hover {
        color: var(--danger-color);
        background: rgba(239, 68, 68, 0.08);
      }
    }

    @media (max-width: 991px) {
      .sidebar-container {
        transform: translateX(-100%);
        
        &.mobile-open {
          transform: translateX(0);
        }
      }
    }
  `]
})
export class SidebarComponent {
  public collapsed = input<boolean>(false);
  public mobileOpen = input<boolean>(false);

  public authStore = inject(AuthStore);

  public menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-chart-bar', route: '/dashboard' },
    {
      label: 'Inventory',
      icon: '',
      children: [
        { label: 'Products', icon: 'pi pi-box', route: '/inventory/products' },
        { label: 'Categories', icon: 'pi pi-tags', route: '/inventory/categories' },
        { label: 'Inventory', icon: 'pi pi-warehouse', route: '/inventory/overview' }
      ]
    },
    {
      label: 'Operations',
      icon: '',
      children: [
        { label: 'Stock Movements', icon: 'pi pi-sync', route: '/operations/movements' }
      ]
    },
    {
      label: 'Administration',
      icon: '',
      permission: 'users:read',
      children: [
        { label: 'Users', icon: 'pi pi-users', route: '/admin/users', permission: 'users:read' },
        { label: 'Roles', icon: 'pi pi-shield', route: '/admin/roles', permission: 'roles:read' }
      ]
    },
    { label: 'Reports', icon: 'pi pi-file-pdf', route: '/reports', permission: 'reports:read' },
    { label: 'Settings', icon: 'pi pi-cog', route: '/settings', permission: 'settings:read' }
  ];

  public onLogout(): void {
    this.authStore.logout();
  }
}
