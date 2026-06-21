import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SettingsService } from '../../core/services/settings.service';
import { AuthStore } from '../../stores/auth.store';
import { AppSettings } from '../../core/models/app.models';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';

// PrimeNG Modules
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { delay, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BreadcrumbComponent,
    SkeletonLoaderComponent,
    InputTextModule,
    Textarea,
    ButtonModule,
    SelectButtonModule,
    ToggleSwitch,
    PasswordModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="settings-container fade-in">
      <p-toast></p-toast>

      <!-- Page Header -->
      <div class="flex justify-content-between align-items-center mb-3">
        <div>
          <app-breadcrumb></app-breadcrumb>
          <h1 class="page-title">Workspace configurations</h1>
          <p class="page-subtitle">Adjust company data, security keys, and alert preferences</p>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="glass-card p-3 mb-4">
        <p-selectButton [options]="tabOptions" 
                        [(ngModel)]="activeTab" 
                        optionLabel="label" 
                        optionValue="value" 
                        styleClass="layout-select-button">
        </p-selectButton>
      </div>

      @if (loading()) {
        <div class="glass-card p-4">
          <app-skeleton-loader type="list"></app-skeleton-loader>
        </div>
      } @else {
        <!-- TAB 1: Company Profile -->
        <div *ngIf="activeTab === 'company'" class="glass-card p-4 fade-in">
          <h3 class="font-bold text-lg mb-2"><i class="pi pi-building mr-2 text-primary"></i>Company Account Profile</h3>
          <p class="text-xs text-secondary mb-4">Manage details displayed on invoice prints and export logs.</p>
          
          <form [formGroup]="companyForm" (ngSubmit)="saveCompanySettings()" class="p-fluid">
            <div class="field mb-3">
              <label for="compName" class="font-semibold block mb-2">Registered Company Name</label>
              <input id="compName" pInputText formControlName="companyName" />
            </div>

            <div class="field mb-3">
              <label for="logoUrl" class="font-semibold block mb-2">Company Brand Logo</label>
              <div class="flex gap-2">
                <input id="logoUrl" pInputText formControlName="logo" class="flex-grow-1" />
                <button pButton 
                        type="button" 
                        icon="pi pi-upload" 
                        class="p-button-outlined"
                        (click)="logoInput.click()">
                </button>
                <input #logoInput 
                       type="file" 
                       style="display: none" 
                       accept="image/*" 
                       (change)="onCompanyLogoUpload($event)" />
              </div>
              @if (uploadingLogo()) {
                <small class="text-primary block mt-1"><i class="pi pi-spin pi-spinner mr-1"></i>Uploading logo...</small>
              }
            </div>

            <div class="grid">
              <div class="col-12 md:col-6 field mb-3">
                <label for="compEmail" class="font-semibold block mb-2">Corporate Billing Email</label>
                <input id="compEmail" pInputText formControlName="email" />
              </div>
              <div class="col-12 md:col-6 field mb-3">
                <label for="compPhone" class="font-semibold block mb-2">Billing Hotline Phone</label>
                <input id="compPhone" pInputText formControlName="phone" />
              </div>
            </div>

            <div class="field mb-4">
              <label for="compAddress" class="font-semibold block mb-2">Physical HQ Address</label>
              <textarea id="compAddress" pTextarea formControlName="address" rows="3"></textarea>
            </div>

            <div class="flex justify-content-end">
              <button pButton 
                      type="submit" 
                      label="Commit Company Changes" 
                      class="p-button-primary" 
                      [loading]="savingSettings()"
                      [disabled]="companyForm.invalid">
              </button>
            </div>
          </form>
        </div>

        <!-- TAB 2: Personal Profile & Password -->
        <div *ngIf="activeTab === 'profile'" class="grid fade-in">
          <!-- User Details Form -->
          <div class="col-12 lg:col-7">
            <div class="glass-card p-4 h-full">
              <h3 class="font-bold text-lg mb-2"><i class="pi pi-user mr-2 text-primary"></i>Personal Profile Settings</h3>
              <p class="text-xs text-secondary mb-4">Update contact information for your login account.</p>
              
              <form [formGroup]="profileForm" (ngSubmit)="saveProfileSettings()" class="p-fluid">
                <div class="grid">
                  <div class="col-12 md:col-6 field mb-3">
                    <label for="fName" class="font-semibold block mb-2">First Name</label>
                    <input id="fName" pInputText formControlName="firstName" />
                  </div>
                  <div class="col-12 md:col-6 field mb-3">
                    <label for="lName" class="font-semibold block mb-2">Last Name</label>
                    <input id="lName" pInputText formControlName="lastName" />
                  </div>
                </div>

                <div class="field mb-4">
                  <label for="email" class="font-semibold block mb-2">Email Address</label>
                  <input id="email" pInputText formControlName="email" />
                </div>

                <div class="flex justify-content-end">
                  <button pButton 
                          type="submit" 
                          label="Save Profile" 
                          class="p-button-primary" 
                          [loading]="savingSettings()"
                          [disabled]="profileForm.invalid">
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Password Reset Form -->
          <div class="col-12 lg:col-5">
            <div class="glass-card p-4 h-full">
              <h3 class="font-bold text-lg mb-2"><i class="pi pi-key mr-2 text-primary"></i>Security Password Credentials</h3>
              <p class="text-xs text-secondary mb-4">Shift auth key credentials to safeguard access.</p>
              
              <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="p-fluid">
                <div class="field mb-3">
                  <label for="oldPass" class="font-semibold block mb-2">Current Secret Key</label>
                  <p-password id="oldPass" 
                              formControlName="oldPassword" 
                              [feedback]="false" 
                              [toggleMask]="true"
                              styleClass="w-full"
                              inputStyleClass="w-full">
                  </p-password>
                </div>

                <div class="field mb-3">
                  <label for="newPass" class="font-semibold block mb-2">New Secret Key</label>
                  <p-password id="newPass" 
                              formControlName="newPassword" 
                              [feedback]="true" 
                              [toggleMask]="true"
                              styleClass="w-full"
                              inputStyleClass="w-full">
                  </p-password>
                </div>

                <div class="field mb-4">
                  <label for="confPass" class="font-semibold block mb-2">Confirm New Secret Key</label>
                  <p-password id="confPass" 
                              formControlName="confirmPassword" 
                              [feedback]="false" 
                              [toggleMask]="true"
                              styleClass="w-full"
                              inputStyleClass="w-full">
                  </p-password>
                </div>

                <div class="flex justify-content-end">
                  <button pButton 
                          type="submit" 
                          label="Change Password" 
                          class="p-button-outlined p-button-danger" 
                          [disabled]="passwordForm.invalid">
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- TAB 3: Notifications Preference -->
        <div *ngIf="activeTab === 'notifications'" class="glass-card p-4 fade-in">
          <h3 class="font-bold text-lg mb-2"><i class="pi pi-bell mr-2 text-primary"></i>System Notification Preferences</h3>
          <p class="text-xs text-secondary mb-4">Choose what logs, critical states, and summary digests generate system alerts.</p>
          
          <form [formGroup]="notificationsForm" (ngSubmit)="saveNotificationSettings()" class="p-fluid">
            <!-- Email alerts -->
            <div class="flex align-items-center justify-content-between p-3 border-bottom-1 border-color-light">
              <div>
                <h4 class="font-semibold text-sm mb-1">Billing Email Alerts</h4>
                <p class="text-xs text-secondary">Receive corporate invoicing, renewal, and stock receipt emails.</p>
              </div>
              <p-toggleswitch formControlName="emailAlerts"></p-toggleswitch>
            </div>

            <!-- Low stock alerts -->
            <div class="flex align-items-center justify-content-between p-3 border-bottom-1 border-color-light">
              <div>
                <h4 class="font-semibold text-sm mb-1">Low Stock Warning Indicators</h4>
                <p class="text-xs text-secondary">Trigger alert badges and nav banner flags when units drop below threshold limits.</p>
              </div>
              <p-toggleswitch formControlName="lowStockAlerts"></p-toggleswitch>
            </div>

            <!-- Daily reports -->
            <div class="flex align-items-center justify-content-between p-3 mb-4">
              <div>
                <h4 class="font-semibold text-sm mb-1">Daily Automated Summary Digests</h4>
                <p class="text-xs text-secondary">Compile daily transaction ledgers and deliver directly to admins.</p>
              </div>
              <p-toggleswitch formControlName="dailyReports"></p-toggleswitch>
            </div>

            <div class="flex justify-content-end">
              <button pButton 
                      type="submit" 
                      label="Confirm Preferences" 
                      class="p-button-primary" 
                      [loading]="savingSettings()"
                      [disabled]="notificationsForm.invalid">
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-container {
      font-family: var(--font-family);
    }
    
    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-color);
      letter-spacing: -0.02em;
      margin-bottom: 0.25rem;
    }
    
    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }

    .border-bottom-1 { border-bottom: 1px solid var(--border-color); }
    .border-color-light { border-color: var(--border-color); }

    ::ng-deep .layout-select-button {
      .p-button {
        padding: 0.5rem 1.25rem !important;
        font-size: 0.85rem !important;
        border: 1px solid var(--border-color) !important;
        background: transparent !important;
        color: var(--text-secondary) !important;
        
        &.p-highlight {
          background: var(--primary-color) !important;
          color: white !important;
          border-color: var(--primary-color) !important;
        }
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private authStore = inject(AuthStore);
  private messageService = inject(MessageService);
  private http = inject(HttpClient);

  public activeTab = 'company';
  public loading = signal<boolean>(false);
  public savingSettings = signal<boolean>(false);
  public uploadingLogo = signal<boolean>(false);

  // Forms
  public companyForm!: FormGroup;
  public profileForm!: FormGroup;
  public passwordForm!: FormGroup;
  public notificationsForm!: FormGroup;

  public tabOptions = [
    { label: 'Company Profile', value: 'company' },
    { label: 'Security & Profile', value: 'profile' },
    { label: 'System Notifications', value: 'notifications' }
  ];

  public ngOnInit(): void {
    this.initForms();
    this.loadSettings();
  }

  private initForms(): void {
    this.companyForm = this.fb.group({
      companyName: ['', Validators.required],
      logo: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required]
    });

    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(4)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.notificationsForm = this.fb.group({
      emailAlerts: [true],
      lowStockAlerts: [true],
      dailyReports: [false]
    });
  }

  private passwordMatchValidator(g: FormGroup) {
    const newPass = g.get('newPassword')?.value;
    const confPass = g.get('confirmPassword')?.value;
    return newPass === confPass ? null : { mismatch: true };
  }

  private loadSettings(): void {
    this.loading.set(true);
    this.settingsService.getSettings()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (settings) => {
          this.companyForm.patchValue(settings.company);
          this.profileForm.patchValue(settings.profile);
          this.notificationsForm.patchValue(settings.notifications);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Load Failure',
            detail: 'Failed to retrieve tenant configuration preferences.'
          });
        }
      });
  }

  public saveCompanySettings(): void {
    if (this.companyForm.invalid) return;
    this.submitSettings({
      company: this.companyForm.value,
      profile: this.profileForm.value,
      notifications: this.notificationsForm.value
    }, 'Company profile successfully modified.');
  }

  public saveProfileSettings(): void {
    if (this.profileForm.invalid) return;
    this.submitSettings({
      company: this.companyForm.value,
      profile: this.profileForm.value,
      notifications: this.notificationsForm.value
    }, 'User profile settings successfully modified.');
  }

  public saveNotificationSettings(): void {
    if (this.notificationsForm.invalid) return;
    this.submitSettings({
      company: this.companyForm.value,
      profile: this.profileForm.value,
      notifications: this.notificationsForm.value
    }, 'Notification alerts settings updated.');
  }

  private submitSettings(settings: AppSettings, successMsg: string): void {
    this.savingSettings.set(true);
    this.settingsService.saveSettings(settings)
      .pipe(finalize(() => this.savingSettings.set(false)))
      .subscribe({
        next: (saved) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Settings Saved',
            detail: successMsg
          });
          // Update details in AuthStore session
          if (this.authStore.tenant()) {
            const updatedTenant = {
              ...this.authStore.tenant()!,
              name: saved.company.companyName,
              logo: saved.company.logo
            };
            const updatedUser = {
              ...this.authStore.user()!,
              firstName: saved.profile.firstName,
              lastName: saved.profile.lastName,
              email: saved.profile.email
            };
            // Re-auth locally
            const isRemembered = localStorage.getItem('ims_remember') === 'true';
            this.authStore.setAuth(
              this.authStore.accessToken() || '',
              this.authStore.refreshToken() || '',
              updatedUser,
              updatedTenant,
              isRemembered
            );
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Operation Failed',
            detail: 'Unable to commit preference shifts.'
          });
        }
      });
  }

  public changePassword(): void {
    if (this.passwordForm.invalid) return;

    this.savingSettings.set(true);
    // Simulate API password change
    of(null).pipe(
      delay(800),
      finalize(() => this.savingSettings.set(false))
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Security Key Shifted',
          detail: 'Auth password changed successfully.'
        });
        this.passwordForm.reset();
      }
    });
  }

  public onCompanyLogoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const formData = new FormData();
      formData.append('file', file);

      this.uploadingLogo.set(true);
      this.http.post<{ url: string }>('/api/upload', formData).subscribe({
        next: (res) => {
          this.companyForm.patchValue({ logo: res.url });
          this.uploadingLogo.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Logo Uploaded',
            detail: 'Company logo updated successfully.'
          });
        },
        error: (err) => {
          this.uploadingLogo.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: err.error?.message || 'Could not upload image file.'
          });
        }
      });
    }
  }
}
