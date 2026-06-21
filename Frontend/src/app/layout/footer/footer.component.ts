import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer-container">
      <div class="footer-content">
        <span class="copyright">&copy; 2026 Enterprise Inventory Management SaaS. All rights reserved.</span>
        <div class="footer-tenant-status">
          <span class="dot"></span>
          <span>Tenant: <strong>{{ authStore.tenant()?.name || 'Unbound' }}</strong></span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-container {
      background: var(--surface-card);
      backdrop-filter: blur(12px);
      border-top: 1px solid var(--border-color);
      padding: 1rem 1.5rem;
      margin-top: auto;
    }
    
    .footer-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    
    .copyright {
      font-weight: 500;
    }
    
    .footer-tenant-status {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      
      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--success-color);
        display: inline-block;
        box-shadow: 0 0 8px var(--success-color);
      }
    }

    @media (max-width: 767px) {
      .footer-content {
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {
  public authStore = inject(AuthStore);
}
