import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../stores/auth.store';
import { MockDbService } from '../../../core/services/mock-db.service';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { MessageModule } from 'primeng/message';

interface TenantOption {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    ButtonModule,
    Select,
    MessageModule,
    RouterLink
  ],
  template: `
    <div class="login-wrapper">
      <div class="login-background"></div>
      
      <div class="login-card-container glass-card fade-in">
        <div class="login-header">
          <div class="logo-box">
            <i class="pi pi-box"></i>
          </div>
          <h2>Sign in to Platform</h2>
          <p>Multi-Tenant Inventory Control Suite</p>
        </div>

        @if (authStore.error(); as err) {
          <div class="error-banner mb-3 p-3 border-round">
            <i class="pi pi-exclamation-circle error-icon"></i>
            <span>{{ err }}</span>
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <!-- Tenant Selector -->
          <div class="form-field">
            <label for="tenant">Tenant Workspace</label>
            <p-select 
              id="tenant" 
              [options]="tenantOptions" 
              formControlName="tenantId" 
              placeholder="Select company workspace" 
              styleClass="w-full"
              panelStyleClass="tenant-dropdown-panel">
              <ng-template let-item pTemplate="selectedItem">
                <div class="tenant-option-item">
                  <i [class]="item.icon"></i>
                  <span>{{ item.label }}</span>
                </div>
              </ng-template>
              <ng-template let-item pTemplate="item">
                <div class="tenant-option-item">
                  <i [class]="item.icon"></i>
                  <span>{{ item.label }}</span>
                </div>
              </ng-template>
            </p-select>
          </div>

          <!-- Email Input -->
          <div class="form-field">
            <label for="email">Email Address</label>
            <span class="p-input-icon-left w-full">
              <input 
                id="email" 
                type="email" 
                pInputText 
                formControlName="email" 
                class="w-full" 
                placeholder="name@company.com" />
            </span>
            @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
              <small class="p-error">Please enter a valid email address.</small>
            }
          </div>

          <!-- Password Input -->
          <div class="form-field">
            <div class="flex justify-content-between align-items-center mb-1">
              <label for="password" class="mb-0">Password</label>
              <a href="javascript:void(0)" class="forgot-link">Forgot?</a>
            </div>
            <p-password 
              id="password" 
              formControlName="password" 
              [toggleMask]="true" 
              [feedback]="false" 
              styleClass="w-full" 
              inputStyleClass="w-full" 
              placeholder="••••••••" />
            @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
              <small class="p-error">Password is required.</small>
            }
          </div>

          <!-- Remember Me -->
          <div class="flex justify-content-between align-items-center mb-4">
            <div class="flex align-items-center gap-2">
              <p-checkbox 
                formControlName="rememberMe" 
                [binary]="true" 
                inputId="rememberMe" />
              <label for="rememberMe" class="remember-label mb-0 cursor-pointer">Remember session</label>
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            pButton 
            type="submit" 
            label="Access Portal" 
            [loading]="authStore.loading()" 
            class="p-button-primary w-full py-3" 
            [disabled]="loginForm.invalid">
          </button>
        </form>

        <div class="register-link-container text-center mt-3 text-sm" style="color: #94a3b8;">
          <span>New tenant? </span>
          <a routerLink="/auth/register" class="register-link font-semibold text-primary" style="text-decoration: none; cursor: pointer;">Register Workspace</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background-color: #0b0f19;
      padding: 1.5rem;
      font-family: var(--font-family);
    }
    
    .login-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      background: radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.15) 0%, transparent 40%),
                  radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 45%);
    }
    
    .login-card-container {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem 2rem;
      z-index: 2;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      background: rgba(15, 23, 42, 0.75) !important;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3) !important;
      color: #f1f5f9;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
      
      .logo-box {
        width: 50px;
        height: 50px;
        border-radius: 12px;
        background: var(--primary-color);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
        box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
        
        i {
          font-size: 1.5rem;
          color: white;
        }
      }
      
      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.35rem;
      }
      
      p {
        font-size: 0.85rem;
        color: #94a3b8;
      }
    }
    
    .form-field {
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #cbd5e1;
      }
    }
    
    .remember-label {
      font-size: 0.85rem;
      color: #94a3b8;
    }
    
    .forgot-link {
      font-size: 0.8rem;
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 600;
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    .error-banner {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      .error-icon {
        font-size: 1rem;
        color: var(--danger-color);
      }
    }
    
    .tenant-option-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
      
      i {
        color: var(--primary-color);
      }
    }

    // Credentials Quick Helper Card
    .credentials-helper-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 1rem;
      
      .helper-title {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #cbd5e1;
        display: flex;
        align-items: center;
      }
      
      .helper-content {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      
      .helper-row {
        font-size: 0.75rem;
        color: #94a3b8;
        
        .helper-role {
          font-weight: 600;
          color: #e2e8f0;
          display: inline-block;
          width: 90px;
        }
        
        code {
          background: rgba(255, 255, 255, 0.07);
          color: #f1f5f9;
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
        }
      }
    }

    ::ng-deep .tenant-dropdown-panel {
      background: #0f172a !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      color: #cbd5e1 !important;
      
      .p-dropdown-item {
        color: #cbd5e1 !important;
        
        &:hover, &.p-highlight {
          background: rgba(37, 99, 235, 0.15) !important;
          color: white !important;
        }
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  public authStore = inject(AuthStore);
  private db = inject(MockDbService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public loginForm!: FormGroup;
  private returnUrl: string = '/dashboard';

  public tenantOptions: TenantOption[] = [];

  public ngOnInit(): void {
    // Load tenants dynamically from Backend API
    this.authService.getTenants().subscribe({
      next: (list) => {
        this.tenantOptions = list.map(t => ({
          label: t.name,
          value: t.id,
          icon: t.id === 'globex' ? 'pi pi-compass' : t.id === 'acme' ? 'pi pi-building' : 'pi pi-star'
        }));
      },
      error: () => {
        // Fallback in case of server connection failure
        this.tenantOptions = [
          { label: 'Acme Corporation Ltd.', value: 'acme', icon: 'pi pi-building' },
          { label: 'Globex Industries Inc.', value: 'globex', icon: 'pi pi-compass' }
        ];
      }
    });

    const queryTenant = this.route.snapshot.queryParams['tenant'] || 'acme';

    this.loginForm = this.fb.group({
      tenantId: [queryTenant, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });

    // Check if user is already authenticated
    if (this.authStore.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    // Capture return URL
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  public onSubmit(): void {
    if (this.loginForm.invalid) return;

    const { email, password, tenantId, rememberMe } = this.loginForm.value;

    this.authService.login(email, password, tenantId, rememberMe).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      }
    });
  }
}
