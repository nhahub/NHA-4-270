import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserStore } from '../../stores/user.store';
import { Role } from '../../core/models/app.models';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface PermissionMatrixRow {
  key: string;
  module: string;
  label: string;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    SkeletonLoaderComponent,
    ErrorStateComponent,
    TableModule,
    CheckboxModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="roles-container fade-in">
      <p-toast></p-toast>

      <!-- Page Header -->
      <div class="flex justify-content-between align-items-center mb-3">
        <div>
          <app-breadcrumb></app-breadcrumb>
          <h1 class="page-title">RBAC Authorization matrix</h1>
          <p class="page-subtitle">Map system capabilities to roles. Changes apply instantly to active sessions.</p>
        </div>
      </div>

      <!-- State handling -->
      @if (userStore.error(); as err) {
        <app-error-state [message]="err" (retry)="userStore.loadUsersAndRoles()"></app-error-state>
      } @else if (userStore.loading() && userStore.roles().length === 0) {
        <app-skeleton-loader type="table"></app-skeleton-loader>
      } @else {
        <!-- Roles Details Info Boxes -->
        <div class="grid mb-4">
          @for (role of tenantRoles(); track role.id) {
            <div class="col-12 md:col-4">
              <div class="glass-card p-3 border-top-3" [class]="getRoleBorderClass(role.name)">
                <h4 class="font-bold mb-2">{{ role.name }}</h4>
                <p class="text-xs text-secondary mb-3">{{ role.description }}</p>
                <div class="flex justify-content-between text-xs font-semibold">
                  <span>Granted Permissions:</span>
                  <span class="text-primary">{{ role.permissions.length }} items</span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Permission Matrix Grid -->
        <div class="glass-card p-4">
          <h3 class="font-bold text-lg mb-4"><i class="pi pi-shield mr-2 text-primary"></i>Granular Capabilities Matrix</h3>
          
          <p-table [value]="permissionRows" [rowHover]="true" class="w-full">
            <ng-template pTemplate="header">
              <tr>
                <th>Module Scope</th>
                <th>Operation Capability</th>
                @for (role of tenantRoles(); track role.id) {
                  <th class="text-center">{{ role.name }}</th>
                }
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-perm>
              <tr>
                <td>
                  <span class="text-xs font-bold text-secondary text-uppercase tracking-wider">
                    {{ perm.module }}
                  </span>
                </td>
                <td>
                  <div class="flex flex-column gap-1">
                    <span class="font-semibold text-sm">{{ perm.label }}</span>
                    <code class="text-xs text-secondary font-mono">{{ perm.key }}</code>
                  </div>
                </td>
                <!-- Checkbox Columns for each role -->
                @for (role of tenantRoles(); track role.id) {
                  <td class="text-center">
                    <p-checkbox 
                      [binary]="true" 
                      [ngModel]="hasPermission(role, perm.key)" 
                      [disabled]="role.name === 'Tenant Admin'"
                      (onChange)="togglePermission(role, perm.key)">
                    </p-checkbox>
                  </td>
                }
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </div>
  `,
  styles: [`
    .roles-container {
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

    .tracking-wider {
      letter-spacing: 0.05em;
    }
    
    .border-top-3 {
      border-top-width: 3px !important;
      border-top-style: solid !important;
      
      &.admin-border { border-top-color: #4f46e5 !important; }
      &.manager-border { border-top-color: #2563eb !important; }
      &.staff-border { border-top-color: #64748b !important; }
    }
  `]
})
export class RolesComponent implements OnInit {
  public userStore = inject(UserStore);
  private messageService = inject(MessageService);

  // List of all capabilities in the platform
  public readonly permissionRows: PermissionMatrixRow[] = [
    { key: 'dashboard:read', module: 'Dashboard', label: 'Access Metrics Analytics' },
    { key: 'products:read', module: 'Products', label: 'View Products Catalog' },
    { key: 'products:write', module: 'Products', label: 'Create/Edit/Delete Products' },
    { key: 'categories:read', module: 'Categories', label: 'View Categories Matrix' },
    { key: 'categories:write', module: 'Categories', label: 'Create/Edit/Delete Categories' },
    { key: 'inventory:read', module: 'Inventory', label: 'View Warehouse stock layout' },
    { key: 'inventory:write', module: 'Inventory', label: 'Modify Stock Allocations' },
    { key: 'movements:read', module: 'Operations', label: 'View Movements Ledgers' },
    { key: 'movements:write', module: 'Operations', label: 'Record Stock Movements' },
    { key: 'users:read', module: 'Administration', label: 'View User Directory' },
    { key: 'users:write', module: 'Administration', label: 'Invite / Modify User configs' },
    { key: 'reports:read', module: 'Reports', label: 'Generate PDF/CSV reports' },
    { key: 'settings:read', module: 'Settings', label: 'Access System Settings' }
  ];

  // We filter out Platform Admin from the matrix as their permissions are global/system level
  public tenantRoles = computed(() => {
    return this.userStore.roles().filter(r => r.name !== 'Platform Admin');
  });

  public ngOnInit(): void {
    this.userStore.loadUsersAndRoles();
  }

  public getRoleBorderClass(roleName: string): string {
    if (roleName.includes('Admin')) return 'admin-border';
    if (roleName.includes('Manager')) return 'manager-border';
    return 'staff-border';
  }

  public hasPermission(role: Role, permissionKey: string): boolean {
    return role.permissions.includes(permissionKey) || role.permissions.includes('all');
  }

  public togglePermission(role: Role, permissionKey: string): void {
    // Prevent modifying Tenant Admin permissions in the dashboard matrix (they are locked to all)
    if (role.name === 'Tenant Admin') return;

    let updatedPerms = [...role.permissions];
    const index = updatedPerms.indexOf(permissionKey);

    if (index > -1) {
      updatedPerms.splice(index, 1);
    } else {
      updatedPerms.push(permissionKey);
    }

    const updatedRole: Role = {
      ...role,
      permissions: updatedPerms
    };

    this.userStore.saveRole(updatedRole, () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Access Matrix Modified',
        detail: `Granular permissions for '${role.name}' updated.`
      });
    });
  }
}
