import { Component, OnInit, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../stores/auth.store';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { Popover } from 'primeng/popover';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MenuModule, ButtonModule, Popover],
  template: `
    <header class="navbar-container glass-card">
      <div class="navbar-left">
        <!-- Sidebar Toggle (Desktop) -->
        <button class="icon-btn hide-on-mobile" (click)="toggleSidebar.emit()" title="Toggle Sidebar">
          <i class="pi pi-bars"></i>
        </button>
        <!-- Sidebar Toggle (Mobile) -->
        <button class="icon-btn show-on-mobile" (click)="toggleMobileSidebar.emit()" title="Menu">
          <i class="pi pi-bars"></i>
        </button>

        <!-- Search Bar -->
        <div class="search-box">
          <i class="pi pi-search search-icon"></i>
          <input type="text" placeholder="Global search..." class="search-input" />
        </div>
      </div>

      <div class="navbar-right">
        <!-- Tenant Identity -->
        <div class="tenant-tag hide-on-mobile">
          <i class="pi pi-building tenant-icon"></i>
          <span>{{ authStore.tenant()?.name }}</span>
        </div>

        <!-- Theme Toggle -->
        <button class="icon-btn" (click)="toggleTheme()" [title]="isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
          <i [class]="isDarkMode() ? 'pi pi-sun sun-icon' : 'pi pi-moon moon-icon'"></i>
        </button>

        <!-- Notifications Dropdown -->
        <button class="icon-btn relative" (click)="notifPanel.toggle($event)" title="Notifications">
          <i class="pi pi-bell"></i>
          @if (unreadNotificationsCount() > 0) {
            <span class="notification-badge"></span>
          }
        </button>

        <!-- User Profile Dropdown -->
        <div class="profile-area" (click)="profileMenu.toggle($event)">
          <div class="avatar">
            {{ userInitials() }}
          </div>
          <div class="profile-info hide-on-mobile">
            <span class="user-name">{{ authStore.user()?.firstName }} {{ authStore.user()?.lastName }}</span>
            <span class="user-role">{{ authStore.user()?.role }}</span>
          </div>
          <i class="pi pi-chevron-down dropdown-arrow hide-on-mobile"></i>
        </div>
      </div>
    </header>

    <!-- Notifications Overlay Panel -->
    <p-popover #notifPanel styleClass="notif-panel-overlay">
      <div class="notif-header">
        <h4>Notifications</h4>
        <button class="clear-btn" (click)="clearNotifications()">Mark all read</button>
      </div>
      <div class="notif-list">
        @if (notifications().length === 0) {
          <div class="no-notif">
            <i class="pi pi-bell-slash"></i>
            <p>No new alerts</p>
          </div>
        } @else {
          @for (notif of notifications(); track notif.id) {
            <div class="notif-item" [class.unread]="!notif.read">
              <div class="notif-icon-circle" [class]="notif.severity">
                <i [class]="notif.icon"></i>
              </div>
              <div class="notif-content">
                <p class="notif-text">{{ notif.message }}</p>
                <span class="notif-time">{{ notif.time }}</span>
              </div>
            </div>
          }
        }
      </div>
    </p-popover>

    <!-- User Action Context Menu -->
    <p-menu #profileMenu [model]="profileMenuItems" [popup]="true"></p-menu>
  `,
  styles: [`
    .navbar-container {
      height: 70px;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: 0;
      border-left: none;
      border-right: none;
      border-top: none;
      background: var(--surface-card);
      position: sticky;
      top: 0;
      z-index: 99;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
    }
    
    .navbar-left, .navbar-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    
    .icon-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-color);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(37, 99, 235, 0.08);
        border-color: rgba(37, 99, 235, 0.3);
        color: var(--primary-color);
      }
      
      i {
        font-size: 1.05rem;
      }
      
      &.relative {
        position: relative;
      }
    }
    
    .notification-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--danger-color);
      border: 1px solid var(--bg-color);
    }

    .sun-icon {
      color: #f59e0b;
    }
    
    .moon-icon {
      color: #6366f1;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      max-width: 280px;
      
      .search-icon {
        position: absolute;
        left: 12px;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }
      
      .search-input {
        width: 100%;
        border-radius: 10px;
        border: 1px solid var(--border-color);
        background: var(--bg-color);
        color: var(--text-color);
        padding: 0.5rem 1rem 0.5rem 2.25rem;
        font-size: 0.85rem;
        transition: border-color 0.2s, box-shadow 0.2s;
        outline: none;
        
        &:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
      }
    }
    
    .tenant-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--primary-color);
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.15);
      padding: 0.4rem 0.85rem;
      border-radius: 20px;
      
      .tenant-icon {
        font-size: 0.9rem;
      }
    }
    
    .profile-area {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      padding: 0.35rem 0.5rem;
      border-radius: 12px;
      transition: background-color 0.2s;
      
      &:hover {
        background: rgba(37, 99, 235, 0.04);
      }
      
      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary-color), #3b82f6);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.95rem;
        box-shadow: 0 4px 10px rgba(37, 99, 235, 0.15);
      }
      
      .profile-info {
        display: flex;
        flex-direction: column;
      }
      
      .user-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-color);
        line-height: 1.2;
      }
      
      .user-role {
        font-size: 0.725rem;
        color: var(--text-secondary);
        font-weight: 500;
      }
      
      .dropdown-arrow {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }

    // Notifications Overlay styles
    ::ng-deep .notif-panel-overlay {
      width: 320px;
      padding: 0 !important;
      border-radius: 16px !important;
      border: 1px solid var(--border-color) !important;
      background: var(--surface-card) !important;
      backdrop-filter: blur(16px) !important;
      box-shadow: var(--shadow-lg) !important;
      overflow: hidden;
      
      .notif-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        
        h4 {
          margin: 0;
          font-weight: 600;
          font-size: 0.95rem;
        }
        
        .clear-btn {
          background: none;
          border: none;
          color: var(--primary-color);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          
          &:hover {
            text-decoration: underline;
          }
        }
      }
      
      .notif-list {
        max-height: 280px;
        overflow-y: auto;
      }
      
      .no-notif {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem 1rem;
        color: var(--text-secondary);
        
        i {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        p {
          font-size: 0.8rem;
        }
      }
      
      .notif-item {
        display: flex;
        gap: 0.75rem;
        padding: 0.85rem 1rem;
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.2s;
        
        &:last-child {
          border-bottom: none;
        }
        
        &.unread {
          background: rgba(37, 99, 235, 0.03);
          
          .notif-text {
            font-weight: 500;
          }
        }
        
        &:hover {
          background: rgba(37, 99, 235, 0.05);
        }
      }
      
      .notif-icon-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        
        i {
          font-size: 0.85rem;
        }
        
        &.warning {
          background: rgba(245, 158, 11, 0.1);
          color: var(--warning-color);
        }
        
        &.danger {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger-color);
        }
        
        &.success {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success-color);
        }
        
        &.info {
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary-color);
        }
      }
      
      .notif-content {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }
      
      .notif-text {
        font-size: 0.8rem;
        color: var(--text-color);
        line-height: 1.3;
      }
      
      .notif-time {
        font-size: 0.7rem;
        color: var(--text-secondary);
      }
    }

    @media (max-width: 991px) {
      .hide-on-mobile {
        display: none !important;
      }
      
      .navbar-container {
        padding: 0 1rem;
      }
    }
  `]
})
export class NavbarComponent implements OnInit {
  public authStore = inject(AuthStore);

  // Emitters
  public toggleSidebar = output<void>();
  public toggleMobileSidebar = output<void>();

  // Signals
  public isDarkMode = signal<boolean>(false);
  public notifications = signal<any[]>([]);
  public unreadNotificationsCount = computed(() => this.notifications().filter(n => !n.read).length);
  public userInitials = computed(() => {
    const user = this.authStore.user();
    if (!user) return '?';
    return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
  });

  public profileMenuItems: MenuItem[] = [];

  public ngOnInit(): void {
    // Read theme state
    const savedTheme = localStorage.getItem('ims_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialThemeDark = savedTheme ? savedTheme === 'dark' : systemPrefersDark;

    this.isDarkMode.set(initialThemeDark);
    this.applyTheme(initialThemeDark);

    // Initialize notification list
    this.notifications.set([
      { id: 1, message: "Low stock alert: Product 'Dell XPS 15' is down to 3 units.", severity: 'warning', icon: 'pi pi-exclamation-triangle', time: '5 mins ago', read: false },
      { id: 2, message: "CRITICAL: 'iPad Pro 11' is completely out of stock.", severity: 'danger', icon: 'pi pi-ban', time: '1 hr ago', read: false },
      { id: 3, message: "Internal transfer of 3 MacBook Pros complete.", severity: 'success', icon: 'pi pi-check-circle', time: '4 hrs ago', read: true },
      { id: 4, message: "Profile settings updated successfully.", severity: 'info', icon: 'pi pi-info-circle', time: '1 day ago', read: true }
    ]);

    // Setup profile dropdown menu
    this.profileMenuItems = [
      {
        label: 'My Account',
        items: [
          { label: 'Security Settings', icon: 'pi pi-cog', routerLink: '/settings' }
        ]
      },
      {
        label: 'Tenant Action',
        items: [
          { label: 'Platform Settings', icon: 'pi pi-building', routerLink: '/settings' }
        ]
      },
      { separator: true },
      {
        label: 'Sign Out',
        icon: 'pi pi-sign-out',
        command: () => {
          this.authStore.logout();
        }
      }
    ];
  }

  public toggleTheme(): void {
    const nextTheme = !this.isDarkMode();
    this.isDarkMode.set(nextTheme);
    localStorage.setItem('ims_theme', nextTheme ? 'dark' : 'light');
    this.applyTheme(nextTheme);
  }

  private applyTheme(dark: boolean): void {
    if (dark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  public clearNotifications(): void {
    const cleared = this.notifications().map(n => ({ ...n, read: true }));
    this.notifications.set(cleared);
  }
}
