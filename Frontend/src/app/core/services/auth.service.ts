import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthStore } from '../../stores/auth.store';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private authStore: AuthStore
  ) {}

  /**
   * Real C# API get tenants list
   */
  public getTenants(): Observable<any[]> {
    return this.http.get<any[]>('/api/auth/tenants');
  }

  /**
   * Real C# API login request
   */
  public login(email: string, password: string, tenantId: string, rememberMe: boolean): Observable<any> {
    this.authStore.setLoading(true);
    this.authStore.setError(null);

    return this.http.post<any>('/api/auth/login', { email, password, tenantId }).pipe(
      tap({
        next: (response) => {
          this.authStore.setAuth(
            response.accessToken,
            response.refreshToken,
            response.user,
            response.tenant,
            rememberMe
          );
          this.authStore.setLoading(false);
        },
        error: (err) => {
          this.authStore.setError(err.error?.message || err.message || 'Authentication failed');
          this.authStore.setLoading(false);
        }
      })
    );
  }

  /**
   * Real C# API Token Refresh request
   */
  public refreshToken(): Observable<any> {
    const currentRefresh = this.authStore.refreshToken();
    const currentUser = this.authStore.user();
    const currentTenant = this.authStore.tenant();

    if (!currentRefresh || !currentUser || !currentTenant) {
      return throwError(() => new Error('No refresh token available.'));
    }

    return this.http.post<any>('/api/auth/refresh', { 
      accessToken: this.authStore.accessToken(),
      refreshToken: currentRefresh 
    }).pipe(
      tap({
        next: (response) => {
          const isRemembered = localStorage.getItem('ims_remember') === 'true';
          this.authStore.setAuth(
            response.accessToken,
            response.refreshToken,
            response.user,
            response.tenant,
            isRemembered
          );
        },
        error: (err) => {
          // Force logout if refresh token validation fails
          this.authStore.logout();
        }
      })
    );
  }

  /**
   * Real C# API Register/Provision Tenant request
   */
  public register(tenantId: string, companyName: string, firstName: string, lastName: string, email: string, password: string): Observable<any> {
    this.authStore.setLoading(true);
    this.authStore.setError(null);

    return this.http.post<any>('/api/auth/register', { 
      tenantId, 
      companyName, 
      firstName, 
      lastName, 
      email,
      password
    }).pipe(
      tap({
        next: () => {
          this.authStore.setLoading(false);
        },
        error: (err) => {
          this.authStore.setError(err.error?.message || err.message || 'Registration failed');
          this.authStore.setLoading(false);
        }
      })
    );
  }
}
