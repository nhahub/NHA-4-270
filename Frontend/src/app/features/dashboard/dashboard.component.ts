import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardStore } from '../../stores/dashboard.store';
import { AuthStore } from '../../stores/auth.store';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexTooltip,
  ApexDataLabels,
  ApexPlotOptions,
  ApexFill,
  ApexLegend,
  ApexResponsive
} from 'ng-apexcharts';

export interface ChartOptions {
  series: ApexAxisChartSeries | any[];
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  legend: ApexLegend;
  colors: string[];
  labels: string[];
  responsive: ApexResponsive[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    SkeletonLoaderComponent,
    ErrorStateComponent,
    NgApexchartsModule,
    ButtonModule,
    CardModule,
    TooltipModule
  ],
  template: `
    <div class="dashboard-container fade-in">
      <div class="flex justify-content-between align-items-center mb-3">
        <div>
          <app-breadcrumb></app-breadcrumb>
          <h1 class="page-title">SaaS Dashboard</h1>
          <p class="page-subtitle">Real-time metrics and operational diagnostics for <strong>{{ authStore.tenant()?.name }}</strong></p>
        </div>
        <div>
          <button pButton 
                  icon="pi pi-refresh" 
                  class="p-button-outlined p-button-sm" 
                  [loading]="dashboardStore.loading()" 
                  (click)="refreshDashboard()">
          </button>
        </div>
      </div>

      <!-- Error State -->
      @if (dashboardStore.error(); as err) {
        <app-error-state [message]="err" (retry)="refreshDashboard()"></app-error-state>
      } @else {
        <!-- Skeleton Loading Cards -->
        @if (dashboardStore.loading() && !dashboardStore.kpis()) {
          <div class="grid mb-4">
            @for (card of [1, 2, 3, 4]; track $index) {
              <div class="col-12 md:col-6 lg:col-3">
                <app-skeleton-loader type="card"></app-skeleton-loader>
              </div>
            }
          </div>
          <div class="grid mb-4">
            <div class="col-12 lg:col-8">
              <app-skeleton-loader type="chart"></app-skeleton-loader>
            </div>
            <div class="col-12 lg:col-4">
              <app-skeleton-loader type="chart"></app-skeleton-loader>
            </div>
          </div>
        } @else {
          <!-- KPI Cards Grid -->
          @if (dashboardStore.kpis(); as kpis) {
            <div class="grid mb-4">
            <!-- Total Products -->
            <div class="col-12 md:col-6 lg:col-3">
              <div class="kpi-card glass-card glass-card-hover">
                <div class="kpi-icon-container info">
                  <i class="pi pi-box"></i>
                </div>
                <div class="kpi-info">
                  <span class="kpi-label">Active SKUs</span>
                  <h2 class="kpi-value">{{ kpis.totalProducts }}</h2>
                  <span class="kpi-subtext">Across catalog listings</span>
                </div>
              </div>
            </div>

            <!-- Total Value -->
            <div class="col-12 md:col-6 lg:col-3">
              <div class="kpi-card glass-card glass-card-hover">
                <div class="kpi-icon-container success">
                  <i class="pi pi-dollar"></i>
                </div>
                <div class="kpi-info">
                  <span class="kpi-label">Inventory Worth</span>
                  <h2 class="kpi-value">{{ kpis.totalValue | currency:'USD':'symbol':'1.0-0' }}</h2>
                  <span class="kpi-subtext">Estimated aggregate valuation</span>
                </div>
              </div>
            </div>

            <!-- Low Stock Alert -->
            <div class="col-12 md:col-6 lg:col-3">
              <div class="kpi-card glass-card glass-card-hover">
                <div class="kpi-icon-container" [class.danger]="kpis.lowStockCount > 0" [class.success]="kpis.lowStockCount === 0">
                  <i class="pi pi-exclamation-triangle"></i>
                </div>
                <div class="kpi-info">
                  <span class="kpi-label">Low Stock Alerts</span>
                  <h2 class="kpi-value" [class.text-danger]="kpis.lowStockCount > 0">
                    {{ kpis.lowStockCount }}
                  </h2>
                  <span class="kpi-subtext">Items needing replenishment</span>
                </div>
              </div>
            </div>

            <!-- Transactions Volume -->
            <div class="col-12 md:col-6 lg:col-3">
              <div class="kpi-card glass-card glass-card-hover">
                <div class="kpi-icon-container warning">
                  <i class="pi pi-sync"></i>
                </div>
                <div class="kpi-info">
                  <span class="kpi-label">Monthly Ops</span>
                  <h2 class="kpi-value">{{ kpis.monthlyTx }}</h2>
                  <span class="kpi-subtext">Stock movement transactions</span>
                </div>
              </div>
            </div>
          </div>
          }

          <!-- Charts Area Grid -->
          @if (dashboardStore.charts(); as charts) {
            <div class="grid mb-4">
            <!-- 1. Stock Trends Line Chart -->
            <div class="col-12 lg:col-8">
              <div class="chart-card glass-card p-4">
                <div class="flex justify-content-between align-items-center mb-3">
                  <h3 class="chart-title">Warehouse Catalog Growth</h3>
                  <span class="chart-subtitle text-xs">Monthly listing aggregation</span>
                </div>
                <div class="chart-wrapper">
                  <apx-chart 
                    [series]="trendChartOptions.series"
                    [chart]="trendChartOptions.chart"
                    [xaxis]="trendChartOptions.xaxis"
                    [stroke]="trendChartOptions.stroke"
                    [colors]="trendChartOptions.colors"
                    [tooltip]="trendChartOptions.tooltip"
                    [dataLabels]="trendChartOptions.dataLabels"
                    [fill]="trendChartOptions.fill"
                    [yaxis]="trendChartOptions.yaxis">
                  </apx-chart>
                </div>
              </div>
            </div>

            <!-- 2. Category Distribution Donut Chart -->
            <div class="col-12 lg:col-4">
              <div class="chart-card glass-card p-4">
                <div class="flex justify-content-between align-items-center mb-3">
                  <h3 class="chart-title">Category Distribution</h3>
                  <span class="chart-subtitle text-xs">SKU distribution by tag</span>
                </div>
                <div class="chart-wrapper flex justify-content-center align-items-center">
                  <apx-chart 
                    [series]="donutChartOptions.series"
                    [chart]="donutChartOptions.chart"
                    [labels]="donutChartOptions.labels"
                    [legend]="donutChartOptions.legend"
                    [colors]="donutChartOptions.colors"
                    [responsive]="donutChartOptions.responsive">
                  </apx-chart>
                </div>
              </div>
            </div>

            <!-- 3. Monthly Movements (In vs Out Bar) -->
            <div class="col-12 lg:col-6">
              <div class="chart-card glass-card p-4 mt-3">
                <div class="flex justify-content-between align-items-center mb-3">
                  <h3 class="chart-title">Stock Transaction Volume</h3>
                  <span class="chart-subtitle text-xs">Stock In vs. Stock Out</span>
                </div>
                <div class="chart-wrapper">
                  <apx-chart 
                    [series]="barChartOptions.series"
                    [chart]="barChartOptions.chart"
                    [xaxis]="barChartOptions.xaxis"
                    [plotOptions]="barChartOptions.plotOptions"
                    [colors]="barChartOptions.colors"
                    [dataLabels]="barChartOptions.dataLabels"
                    [stroke]="barChartOptions.stroke"
                    [fill]="barChartOptions.fill"
                    [legend]="barChartOptions.legend">
                  </apx-chart>
                </div>
              </div>
            </div>

            <!-- 4. Top Products Value Chart -->
            <div class="col-12 lg:col-6">
              <div class="chart-card glass-card p-4 mt-3">
                <div class="flex justify-content-between align-items-center mb-3">
                  <h3 class="chart-title">Valuation Leaders</h3>
                  <span class="chart-subtitle text-xs">Top 5 inventory listings by worth</span>
                </div>
                <div class="chart-wrapper">
                  <apx-chart 
                    [series]="topProductsChartOptions.series"
                    [chart]="topProductsChartOptions.chart"
                    [xaxis]="topProductsChartOptions.xaxis"
                    [plotOptions]="topProductsChartOptions.plotOptions"
                    [colors]="topProductsChartOptions.colors"
                    [dataLabels]="topProductsChartOptions.dataLabels">
                  </apx-chart>
                </div>
              </div>
            </div>
          </div>
          }

          <!-- Bottom Widgets Grid (Activities & Quick Actions) -->
          @if (dashboardStore.stats(); as stats) {
            <div class="grid">
            <!-- Activities Widget -->
            <div class="col-12 lg:col-8">
              <div class="glass-card p-4 h-full">
                <h3 class="widget-title mb-4">
                  <i class="pi pi-clock mr-2 text-primary"></i>Recent Activities
                </h3>
                <div class="activity-timeline">
                  @if (stats.recentActivities.length === 0) {
                    <div class="p-4 text-center text-secondary text-sm">
                      No recent activities recorded for this tenant instance.
                    </div>
                  } @else {
                    @for (log of stats.recentActivities; track log.id) {
                      <div class="activity-row">
                        <span class="activity-indicator" [class]="log.type"></span>
                        <div class="activity-body">
                          <p class="activity-action">{{ log.action }}</p>
                          <span class="activity-meta">by <strong>{{ log.user }}</strong> &bull; {{ log.timestamp | date:'short' }}</span>
                        </div>
                      </div>
                    }
                  }
                </div>
              </div>
            </div>

            <!-- Quick Actions Panel -->
            <div class="col-12 lg:col-4">
              <div class="glass-card p-4 h-full">
                <h3 class="widget-title mb-4">
                  <i class="pi pi-directions mr-2 text-primary"></i>Operations Deck
                </h3>
                <div class="flex flex-column gap-3">
                  <a routerLink="/operations/movements" class="action-card">
                    <div class="action-icon success">
                      <i class="pi pi-plus"></i>
                    </div>
                    <div class="action-details">
                      <h4>Record Stock In</h4>
                      <p>Issue a new receipt movement</p>
                    </div>
                  </a>

                  <a routerLink="/inventory/products" class="action-card">
                    <div class="action-icon info">
                      <i class="pi pi-box"></i>
                    </div>
                    <div class="action-details">
                      <h4>Catalog Management</h4>
                      <p>Create, update, or edit SKUs</p>
                    </div>
                  </a>

                  <a routerLink="/reports" class="action-card">
                    <div class="action-icon warning">
                      <i class="pi pi-file-pdf"></i>
                    </div>
                    <div class="action-details">
                      <h4>Export Reports</h4>
                      <p>Generate CSV, PDF, and spreadsheets</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
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

    // KPI Cards
    .kpi-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.5rem;
      height: 110px;
    }
    
    .kpi-icon-container {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.15);
      
      i {
        font-size: 1.25rem;
        color: var(--primary-color);
      }
      
      &.success {
        background: rgba(34, 197, 94, 0.08);
        border-color: rgba(34, 197, 94, 0.15);
        i { color: var(--success-color); }
      }
      
      &.warning {
        background: rgba(245, 158, 11, 0.08);
        border-color: rgba(245, 158, 11, 0.15);
        i { color: var(--warning-color); }
      }
      
      &.danger {
        background: rgba(239, 68, 68, 0.08);
        border-color: rgba(239, 68, 68, 0.15);
        i { color: var(--danger-color); }
      }
    }
    
    .kpi-info {
      display: flex;
      flex-direction: column;
    }
    
    .kpi-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }
    
    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color);
      line-height: 1;
      margin-bottom: 0.25rem;
    }
    
    .kpi-subtext {
      font-size: 0.7rem;
      color: var(--text-secondary);
    }
    
    .text-danger {
      color: var(--danger-color) !important;
    }

    // Chart layouts
    .chart-card {
      height: 380px;
    }
    
    .chart-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0;
    }

    .chart-subtitle {
      color: var(--text-secondary);
    }
    
    .chart-wrapper {
      height: 300px;
      width: 100%;
    }

    // Widget layouts
    .widget-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
      display: flex;
      align-items: center;
    }
    
    .activity-timeline {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }
    
    .activity-row {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      position: relative;
      
      &:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 5px;
        top: 16px;
        bottom: -20px;
        width: 1px;
        background: var(--border-color);
      }
    }
    
    .activity-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: var(--text-secondary);
      border: 2px solid var(--bg-color);
      margin-top: 4px;
      z-index: 1;
      flex-shrink: 0;
      
      &.success { background-color: var(--success-color); box-shadow: 0 0 6px var(--success-color); }
      &.info { background-color: var(--primary-color); box-shadow: 0 0 6px var(--primary-color); }
      &.warning { background-color: var(--warning-color); box-shadow: 0 0 6px var(--warning-color); }
      &.danger { background-color: var(--danger-color); box-shadow: 0 0 6px var(--danger-color); }
    }
    
    .activity-body {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    
    .activity-action {
      font-size: 0.85rem;
      color: var(--text-color);
      margin: 0;
      font-weight: 500;
    }
    
    .activity-meta {
      font-size: 0.725rem;
      color: var(--text-secondary);
    }
    
    // Quick Actions Action Cards
    .action-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.875rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.02);
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(37, 99, 235, 0.05);
        border-color: rgba(37, 99, 235, 0.25);
        transform: translateX(4px);
      }
      
      .action-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.05);
        
        i {
          font-size: 0.95rem;
        }
        
        &.success { background: rgba(34, 197, 94, 0.1); color: var(--success-color); }
        &.info { background: rgba(37, 99, 235, 0.1); color: var(--primary-color); }
        &.warning { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
      }
      
      .action-details {
        display: flex;
        flex-direction: column;
        
        h4 {
          font-size: 0.85rem;
          font-weight: 600;
          margin: 0;
          color: var(--text-color);
        }
        
        p {
          font-size: 0.725rem;
          color: var(--text-secondary);
          margin: 0;
        }
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  public dashboardStore = inject(DashboardStore);
  public authStore = inject(AuthStore);

  // Chart configs (typed options)
  public trendChartOptions: any;
  public donutChartOptions: any;
  public barChartOptions: any;
  public topProductsChartOptions: any;

  constructor() {
    // Listen to changes in the active tenant to recalculate ApexCharts options reactively
    effect(() => {
      const charts = this.dashboardStore.charts();
      if (charts) {
        this.initializeCharts(charts);
      }
    });
  }

  public ngOnInit(): void {
    this.refreshDashboard();
  }

  public refreshDashboard(): void {
    this.dashboardStore.loadDashboardStats();
  }

  private initializeCharts(charts: any): void {
    const isDark = document.body.classList.contains('dark-theme');
    const labelColor = isDark ? '#94a3b8' : '#64748b';
    const gridBorderColor = isDark ? '#334155' : '#e2e8f0';

    // 1. Catalog Growth Line Chart
    this.trendChartOptions = {
      series: [{
        name: 'Total SKUs',
        data: charts.inventoryTrend
      }],
      chart: {
        type: 'line',
        height: 280,
        toolbar: { show: false },
        animations: { enabled: true }
      },
      xaxis: {
        categories: charts.months,
        labels: { style: { colors: labelColor } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: { style: { colors: labelColor } }
      },
      stroke: {
        curve: 'smooth',
        width: 3.5,
        colors: ['#2563eb']
      },
      colors: ['#2563eb'],
      tooltip: {
        theme: isDark ? 'dark' : 'light'
      },
      fill: {
        type: 'solid'
      },
      dataLabels: {
        enabled: false
      }
    };

    // 2. Category Distribution Donut
    this.donutChartOptions = {
      series: charts.categoryDistribution.map((c: any) => c.count),
      labels: charts.categoryDistribution.map((c: any) => c.name),
      chart: {
        type: 'donut',
        height: 280,
        animations: { enabled: true }
      },
      legend: {
        position: 'bottom',
        labels: { colors: labelColor }
      },
      colors: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      responsive: [{
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: 'bottom' }
        }
      }]
    };

    // 3. Transactions Bar Chart
    this.barChartOptions = {
      series: [
        { name: 'Stock In', data: charts.stockMovement.in },
        { name: 'Stock Out', data: charts.stockMovement.out }
      ],
      chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: false },
        animations: { enabled: true }
      },
      xaxis: {
        categories: charts.months,
        labels: { style: { colors: labelColor } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: { style: { colors: labelColor } }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4
        }
      },
      colors: ['#22c55e', '#ef4444'],
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      fill: {
        opacity: 0.85
      },
      legend: {
        position: 'top',
        labels: { colors: labelColor }
      }
    };

    // 4. Valuation Leaders Horizontal Bar
    this.topProductsChartOptions = {
      series: [{
        name: 'Valuation',
        data: charts.topProducts.map((p: any) => p.value)
      }],
      chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: false },
        animations: { enabled: true }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '60%',
          borderRadius: 4
        }
      },
      colors: ['#8b5cf6'],
      dataLabels: {
        enabled: true,
        formatter: (val: any) => `$${val.toLocaleString()}`,
        style: { colors: ['#fff'] }
      },
      xaxis: {
        categories: charts.topProducts.map((p: any) => p.name),
        labels: {
          formatter: (val: any) => `$${val}`,
          style: { colors: labelColor }
        }
      },
      yaxis: {
        labels: { style: { colors: labelColor } }
      }
    };
  }
}
