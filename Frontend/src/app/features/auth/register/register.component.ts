import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../stores/auth.store';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    RouterLink
  ],
  template: `
    <div class="register-wrapper">
      <div class="register-background"></div>
      
      <div class="register-card-container glass-card fade-in">
        <div class="register-header">
          <div class="logo-box">
            <i class="pi pi-building"></i>
          </div>
          <h2>Register Workspace</h2>
          <p>Provision a new tenant database on the platform</p>
        </div>

        @if (authStore.error(); as err) {
          <div class="error-banner mb-3 p-3 border-round">
            <i class="pi pi-exclamation-circle error-icon"></i>
            <span>{{ err }}</span>
          </div>
        }

        @if (registrationSuccess()) {
          <div class="success-card-panel fade-in text-center">
            <div class="success-icon-wrapper mb-4">
              <div class="pulse-ring"></div>
              <i class="pi pi-check success-check-icon"></i>
            </div>
            
            <h3 class="success-title text-2xl font-bold mb-2">Workspace Created!</h3>
            <p class="success-subtitle text-sm mb-4">Your tenant database is active and ready to build.</p>
            
            <div class="credentials-summary text-left mb-4 p-4 border-round">
              <span class="summary-label block mb-3 text-xs uppercase font-bold text-slate-400">Workspace Details</span>
              <div class="summary-row flex justify-content-between py-2 border-bottom-1 border-white-alpha-10">
                <span class="summary-key text-sm text-slate-300">Tenant ID:</span>
                <span class="summary-value font-mono font-bold text-primary-300" style="color: #60a5fa;">{{ registeredTenantId() }}</span>
              </div>
              <div class="summary-row flex justify-content-between py-2 border-bottom-1 border-white-alpha-10">
                <span class="summary-key text-sm text-slate-300">Admin Email:</span>
                <span class="summary-value font-mono font-bold text-primary-300" style="color: #60a5fa;">{{ registeredEmail() }}</span>
              </div>
              <div class="summary-row flex justify-content-between py-2">
                <span class="summary-key text-sm text-slate-300">Password:</span>
                <span class="summary-value font-bold text-success-300" style="color: #34d399;">Your configured password</span>
              </div>
            </div>

            <button 
              pButton 
              label="Launch Workspace Sign In" 
              class="p-button-success w-full py-3"
              (click)="navigateToLogin()">
            </button>
          </div>
        } @else {
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
            <!-- Tenant Identifier -->
            <div class="form-field">
              <label for="tenantId">Tenant Identifier (Lowercase subdomain)</label>
              <input 
                id="tenantId" 
                type="text" 
                pInputText 
                formControlName="tenantId" 
                class="w-full" 
                placeholder="e.g. acme, globex, cyberdyne" />
              @if (registerForm.get('tenantId')?.touched && registerForm.get('tenantId')?.invalid) {
                <small class="p-error">
                  Alphanumeric identifier is required (lowercase, no spaces, 3-20 chars).
                </small>
              }
            </div>

            <!-- Company Name -->
            <div class="form-field">
              <label for="companyName">Company / Organization Name</label>
              <input 
                id="companyName" 
                type="text" 
                pInputText 
                formControlName="companyName" 
                class="w-full" 
                placeholder="e.g. Acme Corporation Ltd." />
              @if (registerForm.get('companyName')?.touched && registerForm.get('companyName')?.invalid) {
                <small class="p-error">Company name is required.</small>
              }
            </div>

            <!-- Admin First & Last Name -->
            <div class="grid">
              <div class="col-12 md:col-6 form-field">
                <label for="firstName">Admin First Name</label>
                <input 
                  id="firstName" 
                  type="text" 
                  pInputText 
                  formControlName="firstName" 
                  class="w-full" 
                  placeholder="John" />
                @if (registerForm.get('firstName')?.touched && registerForm.get('firstName')?.invalid) {
                  <small class="p-error">First name is required.</small>
                }
              </div>
              <div class="col-12 md:col-6 form-field">
                <label for="lastName">Admin Last Name</label>
                <input 
                  id="lastName" 
                  type="text" 
                  pInputText 
                  formControlName="lastName" 
                  class="w-full" 
                  placeholder="Doe" />
                @if (registerForm.get('lastName')?.touched && registerForm.get('lastName')?.invalid) {
                  <small class="p-error">Last name is required.</small>
                }
              </div>
            </div>

            <!-- Admin Email Address -->
            <div class="form-field">
              <label for="email">Admin Email Address</label>
              <input 
                id="email" 
                type="email" 
                pInputText 
                formControlName="email" 
                class="w-full" 
                placeholder="admin&#64;company.com" />
              @if (registerForm.get('email')?.touched && registerForm.get('email')?.invalid) {
                <small class="p-error">Please enter a valid email address.</small>
              }
            </div>

            <!-- Admin Password -->
            <div class="form-field">
              <label for="password">Admin Password</label>
              <p-password 
                id="password" 
                formControlName="password" 
                [toggleMask]="true" 
                [feedback]="false" 
                styleClass="w-full" 
                inputStyleClass="w-full" 
                placeholder="••••••••" />
              @if (registerForm.get('password')?.touched && registerForm.get('password')?.invalid) {
                <small class="p-error">Password is required (min 4 characters).</small>
              }
            </div>

            <!-- Submit Button -->
            <button 
              pButton 
              type="submit" 
              label="Provision Workspace" 
              [loading]="authStore.loading()" 
              class="p-button-primary w-full py-3 mt-2" 
              [disabled]="registerForm.invalid">
            </button>
          </form>

          <div class="login-link-container text-center mt-3">
            <span>Already have a workspace? </span>
            <a routerLink="/auth/login" class="login-link font-semibold text-primary">Sign In</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .register-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background-color: #0b0f19;
      padding: 1.5rem;
      font-family: var(--font-family);
    }
    
    .register-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      background: radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.15) 0%, transparent 40%),
                  radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 45%);
    }
    
    .register-card-container {
      width: 100%;
      max-width: 500px;
      padding: 2.5rem 2rem;
      z-index: 2;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      background: rgba(15, 23, 42, 0.75) !important;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3) !important;
      color: #f1f5f9;
    }

    .register-header {
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

    .success-card-panel {
      animation: fadeInUp 0.4s ease-out;
    }
    
    .success-icon-wrapper {
      position: relative;
      width: 64px;
      height: 64px;
      background: rgba(34, 197, 94, 0.15);
      border: 2px solid #22c55e;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }
    
    .success-check-icon {
      font-size: 1.75rem;
      color: #22c55e;
      z-index: 2;
    }
    
    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: rgba(34, 197, 94, 0.3);
      animation: pulse 1.8s infinite ease-in-out;
      z-index: 1;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(1.4); opacity: 0; }
    }
    
    .credentials-summary {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .summary-row {
      border-color: rgba(255, 255, 255, 0.08) !important;
    }

    .login-link-container {
      font-size: 0.85rem;
      color: #94a3b8;
      
      .login-link {
        color: var(--primary-color);
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  public authStore = inject(AuthStore);
  private router = inject(Router);

  public registerForm!: FormGroup;
  
  // State management for registration success alert
  public registrationSuccess = signal<boolean>(false);
  public registeredTenantId = signal<string>('');
  public registeredEmail = signal<string>('');

  public ngOnInit(): void {
    this.registerForm = this.fb.group({
      tenantId: ['', [Validators.required, Validators.pattern('^[a-z0-9-]{3,20}$')]],
      companyName: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });

    if (this.authStore.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  public onSubmit(): void {
    if (this.registerForm.invalid) return;

    const { tenantId, companyName, firstName, lastName, email, password } = this.registerForm.value;

    this.authService.register(tenantId, companyName, firstName, lastName, email, password).subscribe({
      next: () => {
        this.registeredTenantId.set(tenantId.toLowerCase().trim());
        this.registeredEmail.set(email.toLowerCase().trim());
        this.registrationSuccess.set(true);
      }
    });
  }

  public navigateToLogin(): void {
    this.router.navigate(['/auth/login'], { queryParams: { tenant: this.registeredTenantId() } });
  }
}
