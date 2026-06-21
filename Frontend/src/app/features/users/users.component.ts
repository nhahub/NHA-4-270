import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserStore } from '../../stores/user.store';
import { User } from '../../core/models/app.models';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BreadcrumbComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    Select,
    ToastModule,
    ConfirmDialogModule,
    ToggleSwitch
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="users-container fade-in">
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>

      <!-- Page Header -->
      <div class="flex justify-content-between align-items-center mb-3">
        <div>
          <app-breadcrumb></app-breadcrumb>
          <h1 class="page-title">User Access Control</h1>
          <p class="page-subtitle">Invite team members, assign RBAC roles, and regulate access states</p>
        </div>
        <div>
          <button pButton 
                  label="Invite Member" 
                  icon="pi pi-user-plus" 
                  class="p-button-primary" 
                  (click)="openCreateDialog()">
          </button>
        </div>
      </div>

      <!-- Search Toolbar -->
      <div class="glass-card p-3 mb-4 flex align-items-center justify-content-between">
        <div class="flex align-items-center gap-2 w-full max-width-320">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search"></i>
            <input pInputText 
                   type="text" 
                   class="w-full" 
                   placeholder="Search members..." 
                   (input)="onSearch($event)" />
          </span>
        </div>
      </div>

      <!-- Displays -->
      @if (userStore.error(); as err) {
        <app-error-state [message]="err" (retry)="userStore.loadUsersAndRoles()"></app-error-state>
      } @else if (userStore.loading() && userStore.users().length === 0) {
        <app-skeleton-loader type="table"></app-skeleton-loader>
      } @else {
        <p-table [value]="userStore.filteredUsers()" 
                 [paginator]="true" 
                 [rows]="10" 
                 [rowsPerPageOptions]="[5, 10, 20]" 
                 [rowHover]="true" 
                 responsiveLayout="scroll"
                 class="w-full">
          
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="firstName">Name <p-sortIcon field="firstName"></p-sortIcon></th>
              <th pSortableColumn="email">Email <p-sortIcon field="email"></p-sortIcon></th>
              <th pSortableColumn="role">Assigned Role <p-sortIcon field="role"></p-sortIcon></th>
              <th pSortableColumn="status">Account Status <p-sortIcon field="status"></p-sortIcon></th>
              <th style="width: 10rem">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-user>
            <tr>
              <td>
                <div class="flex align-items-center gap-2">
                  <div class="avatar-circle">
                    {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                  </div>
                  <span class="font-bold">{{ user.firstName }} {{ user.lastName }}</span>
                </div>
              </td>
              <td>
                <span class="text-secondary">{{ user.email }}</span>
              </td>
              <td>
                <span class="role-chip" [class]="getRoleClass(user.role)">{{ user.role }}</span>
              </td>
              <td>
                <div class="flex align-items-center gap-2">
                  <p-toggleswitch 
                    [ngModel]="user.status === 'Active'" 
                    (onChange)="toggleUserStatus(user)">
                  </p-toggleswitch>
                  <span class="badge" [class]="user.status === 'Active' ? 'badge-success' : 'badge-danger'">
                    {{ user.status }}
                  </span>
                </div>
              </td>
              <td>
                <div class="flex gap-2">
                  <button pButton 
                          icon="pi pi-pencil" 
                          class="p-button-rounded p-button-text p-button-secondary" 
                          (click)="openEditDialog(user)">
                  </button>
                  <button pButton 
                          icon="pi pi-user-minus" 
                          class="p-button-rounded p-button-text p-button-danger" 
                          (click)="confirmDeleteUser(user)">
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5">
                <app-empty-state 
                  title="No Members" 
                  description="No registered users found under this workspace."
                  icon="pi pi-users"
                  actionLabel="Invite Member"
                  (actionClicked)="openCreateDialog()">
                </app-empty-state>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }

      <!-- Add/Edit User Dialog -->
      <p-dialog [(visible)]="displayFormDialog" 
                [header]="isEditMode() ? 'Modify Access Settings' : 'Invite Team Member'" 
                [modal]="true" 
                styleClass="responsive-modal-dialog"
                contentStyleClass="p-fluid">
        
        <form [formGroup]="userForm" class="p-fluid pt-2">
          <!-- First Name & Last Name Grid -->
          <div class="grid">
            <div class="col-12 md:col-6 field mb-3">
              <label for="fName" class="font-semibold block mb-2">First Name</label>
              <input id="fName" type="text" pInputText formControlName="firstName" placeholder="John" />
              @if (userForm.get('firstName')?.touched && userForm.get('firstName')?.invalid) {
                <small class="p-error">First name is required.</small>
              }
            </div>
            <div class="col-12 md:col-6 field mb-3">
              <label for="lName" class="font-semibold block mb-2">Last Name</label>
              <input id="lName" type="text" pInputText formControlName="lastName" placeholder="Doe" />
              @if (userForm.get('lastName')?.touched && userForm.get('lastName')?.invalid) {
                <small class="p-error">Last name is required.</small>
              }
            </div>
          </div>

          <!-- Email -->
          <div class="field mb-3">
            <label for="email" class="font-semibold block mb-2">Email Address</label>
            <input id="email" type="email" pInputText formControlName="email" placeholder="name&#64;company.com" />
            @if (userForm.get('email')?.touched && userForm.get('email')?.invalid) {
              <small class="p-error">A valid email address is required.</small>
            }
          </div>

          <!-- Role -->
          <div class="field mb-4">
            <label for="role" class="font-semibold block mb-2">Assign Role (RBAC)</label>
            <p-select id="role" 
                        [options]="roleOptions" 
                        formControlName="role" 
                        placeholder="Select privilege tier" 
                        styleClass="w-full">
            </p-select>
            <small class="text-secondary mt-1 block">
              Default password for login will match the role name lowercase (e.g. <code>admin</code>, <code>manager</code>, or <code>staff</code>).
            </small>
          </div>

          <!-- Actions -->
          <div class="flex justify-content-end gap-2">
            <button pButton 
                    type="button" 
                    label="Cancel" 
                    class="p-button-outlined p-button-secondary" 
                    (click)="closeDialog()">
            </button>
            <button pButton 
                    type="submit" 
                    label="Confirm Access" 
                    class="p-button-primary" 
                    [disabled]="userForm.invalid"
                    (click)="onSaveUser()">
            </button>
          </div>
        </form>
      </p-dialog>
    </div>
  `,
  styles: [`
    .users-container {
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

    .max-width-320 {
      max-width: 320px;
    }

    .avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.8rem;
    }

    .role-chip {
      font-size: 0.725rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      
      &.admin { background: rgba(79, 70, 229, 0.1); color: #4f46e5; }
      &.manager { background: rgba(59, 130, 246, 0.1); color: #2563eb; }
      &.staff { background: rgba(100, 116, 139, 0.1); color: #64748b; }
    }
  `]
})
export class UsersComponent implements OnInit {
  public userStore = inject(UserStore);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  public displayFormDialog = false;
  public isEditMode = signal<boolean>(false);
  public userForm!: FormGroup;

  public roleOptions = [
    { label: 'Tenant Admin', value: 'Tenant Admin' },
    { label: 'Inventory Manager', value: 'Inventory Manager' },
    { label: 'Staff', value: 'Staff' }
  ];

  public ngOnInit(): void {
    this.userStore.loadUsersAndRoles();

    this.userForm = this.fb.group({
      id: [null],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['Staff', Validators.required],
      status: ['Active', Validators.required]
    });
  }

  public getRoleClass(role: string): string {
    if (role.includes('Admin')) return 'admin';
    if (role.includes('Manager')) return 'manager';
    return 'staff';
  }

  public onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.userStore.searchQuery.set(input.value);
  }

  public openCreateDialog(): void {
    this.isEditMode.set(false);
    this.userForm.reset({
      id: null,
      firstName: '',
      lastName: '',
      email: '',
      role: 'Staff',
      status: 'Active'
    });
    this.displayFormDialog = true;
  }

  public openEditDialog(user: User): void {
    this.isEditMode.set(true);
    this.userForm.setValue({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status
    });
    this.displayFormDialog = true;
  }

  public closeDialog(): void {
    this.displayFormDialog = false;
  }

  public toggleUserStatus(user: User): void {
    const nextStatus: 'Active' | 'Inactive' = user.status === 'Active' ? 'Inactive' : 'Active';
    const updated: User = { ...user, status: nextStatus };
    
    this.userStore.saveUser(updated, () => {
      this.messageService.add({
        severity: nextStatus === 'Active' ? 'success' : 'warn',
        summary: 'Account State Shifted',
        detail: `User '${user.firstName}' account is now ${nextStatus.toLowerCase()}.`
      });
    });
  }

  public onSaveUser(): void {
    if (this.userForm.invalid) return;

    const formVal = this.userForm.value;

    this.userStore.saveUser(formVal, () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Directory Updated',
        detail: this.isEditMode() 
          ? `User settings for '${formVal.firstName}' modified.`
          : `Access invitation sent to '${formVal.email}'.`
      });
      this.closeDialog();
    });
  }

  public confirmDeleteUser(user: User): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to revoke system access for '${user.firstName} ${user.lastName}'?`,
      header: 'Revoke Access Confirmation',
      icon: 'pi pi-user-minus',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary p-button-sm',
      accept: () => {
        this.userStore.deleteUser(user.id, () => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Access Revoked',
            detail: `User '${user.firstName}' removed from directory.`
          });
        });
      }
    });
  }
}
