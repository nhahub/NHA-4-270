import { Injectable, signal, computed, inject } from '@angular/core';
import { DashboardService } from '../core/services/dashboard.service';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DashboardStore {
  private dashboardService = inject(DashboardService);

  // States
  private _stats = signal<any>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Read-only public signals
  public readonly stats = computed(() => this._stats());
  public readonly loading = computed(() => this._loading());
  public readonly error = computed(() => this._error());

  // Extracted values
  public readonly kpis = computed(() => this._stats()?.kpis || null);
  public readonly charts = computed(() => this._stats()?.charts || null);
  public readonly recentActivities = computed(() => this._stats()?.recentActivities || []);

  public loadDashboardStats(): void {
    this._loading.set(true);
    this._error.set(null);
    this.dashboardService.getDashboardStats()
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (res) => this._stats.set(res),
        error: (err) => this._error.set(err.message || 'Failed to load dashboard metrics')
      });
  }
}
