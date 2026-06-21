import { Injectable, signal, computed, effect } from '@angular/core';
import { AuthUser, Tenant, AuthState } from '../core/models/app.models';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  // Primary signals
  private _accessToken = signal<string | null>(null);
  private _refreshToken = signal<string | null>(null);
  private _user = signal<AuthUser | null>(null);
  private _tenant = signal<Tenant | null>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Read-only public signals
  public readonly accessToken = computed(() => this._accessToken());
  public readonly refreshToken = computed(() => this._refreshToken());
  public readonly user = computed(() => this._user());
  public readonly tenant = computed(() => this._tenant());
  public readonly loading = computed(() => this._loading());
  public readonly error = computed(() => this._error());

  // Computed state
  public readonly isAuthenticated = computed(() => !!this._accessToken());
  public readonly tenantId = computed(() => this._tenant()?.id || null);
  public readonly userRole = computed(() => this._user()?.role || null);
  
  public readonly isAdmin = computed(() => {
    const role = this._user()?.role;
    return role === 'Platform Admin' || role === 'Tenant Admin';
  });

  public readonly isInventoryManager = computed(() => {
    return this._user()?.role === 'Inventory Manager';
  });

  constructor(private router: Router) {
    this.restoreSession();

    // Setup an effect to automatically trigger logout on token expiration simulation
    effect(() => {
      if (this.isAuthenticated()) {
        // Start auto-logout timer of 1 hour for simulated security
        const logoutTimer = setTimeout(() => {
          this.logout();
        }, 3600000); // 1 hour

        return () => clearTimeout(logoutTimer);
      }
      return;
    });
  }

  // Set Auth state
  public setAuth(accessToken: string, refreshToken: string, user: AuthUser, tenant: Tenant, rememberMe: boolean): void {
    this._accessToken.set(accessToken);
    this._refreshToken.set(refreshToken);
    this._user.set(user);
    this._tenant.set(tenant);
    this._error.set(null);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('ims_token', accessToken);
    storage.setItem('ims_refresh', refreshToken);
    storage.setItem('ims_user', JSON.stringify(user));
    storage.setItem('ims_tenant', JSON.stringify(tenant));
    storage.setItem('ims_remember', rememberMe ? 'true' : 'false');
  }

  // Restore session from storage
  private restoreSession(): void {
    const isRemembered = localStorage.getItem('ims_remember') === 'true';
    const storage = isRemembered ? localStorage : sessionStorage;

    const token = storage.getItem('ims_token');
    const refresh = storage.getItem('ims_refresh');
    const userStr = storage.getItem('ims_user');
    const tenantStr = storage.getItem('ims_tenant');

    if (token && refresh && userStr && tenantStr) {
      try {
        this._accessToken.set(token);
        this._refreshToken.set(refresh);
        this._user.set(JSON.parse(userStr));
        this._tenant.set(JSON.parse(tenantStr));
      } catch (e) {
        this.clearSession();
      }
    }
  }

  public setLoading(isLoading: boolean): void {
    this._loading.set(isLoading);
  }

  public setError(err: string | null): void {
    this._error.set(err);
  }

  // Logout clean up
  public logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  private clearSession(): void {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    this._tenant.set(null);
    this._error.set(null);

    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_refresh');
    localStorage.removeItem('ims_user');
    localStorage.removeItem('ims_tenant');
    localStorage.removeItem('ims_remember');

    sessionStorage.removeItem('ims_token');
    sessionStorage.removeItem('ims_refresh');
    sessionStorage.removeItem('ims_user');
    sessionStorage.removeItem('ims_tenant');
    sessionStorage.removeItem('ims_remember');
  }

  // Check user permissions against RBAC permissions
  public hasPermission(action: string): boolean {
    const role = this.userRole();
    if (!role) return false;
    if (role === 'Platform Admin') return true; // Platform Admin bypasses all checks

    // Standard static permission mapping
    const rbacMatrix: Record<string, string[]> = {
      'Tenant Admin': ['all'],
      'Inventory Manager': [
        'dashboard:read', 
        'products:read', 'products:write', 
        'categories:read', 'categories:write', 
        'inventory:read', 'inventory:write', 
        'movements:read', 'movements:write', 
        'reports:read', 'settings:read'
      ],
      'Staff': [
        'dashboard:read', 
        'products:read', 
        'categories:read', 
        'inventory:read', 
        'movements:read', 'movements:write'
      ]
    };

    const allowed = rbacMatrix[role];
    if (!allowed) return false;
    if (allowed.includes('all')) return true;
    return allowed.includes(action);
  }
}
