import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductStore } from '../../stores/product.store';
import { InventoryStore } from '../../stores/inventory.store';
import { UserStore } from '../../stores/user.store';
import { DashboardStore } from '../../stores/dashboard.store';
import { AuthStore } from '../../stores/auth.store';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb.component';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  severity: 'info' | 'success' | 'warn' | 'danger';
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    ButtonModule,
    CardModule,
    TableModule,
    ToastModule,
    TagModule
  ],
  providers: [MessageService],
  template: `
    <div class="reports-container fade-in">
      <p-toast></p-toast>

      <!-- Page Header -->
      <div class="flex justify-content-between align-items-center mb-3">
        <div>
          <app-breadcrumb></app-breadcrumb>
          <h1 class="page-title">Analytics Reports</h1>
          <p class="page-subtitle">Compile audits, inventory valuations, and low-stock diagnostics</p>
        </div>
      </div>

      <div class="grid">
        <!-- Reports Directory List -->
        <div class="col-12 lg:col-4">
          <div class="flex flex-column gap-3">
            @for (rep of reportsDirectory; track rep.id) {
              <div class="report-selection-card glass-card p-3 cursor-pointer" 
                   [class.active]="selectedReportId() === rep.id" 
                   (click)="selectReport(rep.id)">
                <div class="flex align-items-center gap-3">
                  <div class="report-icon-box" [class]="rep.severity">
                    <i [class]="rep.icon"></i>
                  </div>
                  <div class="flex-grow-1">
                    <h4 class="font-bold text-sm mb-1">{{ rep.name }}</h4>
                    <p class="text-xs text-secondary">{{ rep.description }}</p>
                  </div>
                  <i class="pi pi-chevron-right text-xs text-secondary"></i>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Report Preview Area -->
        <div class="col-12 lg:col-8">
          <div class="glass-card p-4 h-full flex flex-column">
            @if (activeReport(); as rep) {
              <!-- Preview Header -->
              <div class="flex justify-content-between align-items-start mb-4 border-bottom-1 border-color-light pb-3">
                <div>
                  <span class="badge mb-2" [class]="getReportBadgeClass(rep.severity)">Live Compile</span>
                  <h3 class="font-bold text-lg">{{ rep.name }}</h3>
                  <p class="text-xs text-secondary mt-1">Compiled on {{ todayDate | date:'medium' }}</p>
                </div>
                <div class="flex gap-2">
                  <button pButton 
                          label="Print" 
                          icon="pi pi-print" 
                          class="p-button-outlined p-button-secondary p-button-sm" 
                          (click)="printReport()">
                  </button>
                  <button pButton 
                          label="Excel" 
                          icon="pi pi-file-excel" 
                          class="p-button-outlined p-button-success p-button-sm" 
                          [loading]="exportingExcel()"
                          (click)="exportExcel(rep.name)">
                  </button>
                  <button pButton 
                          label="PDF" 
                          icon="pi pi-file-pdf" 
                          class="p-button-danger p-button-sm" 
                          [loading]="exportingPdf()"
                          (click)="exportPdf(rep.name)">
                  </button>
                </div>
              </div>

              <!-- Report Table Previews -->
              <div class="report-content-box flex-grow-1">
                <!-- Printable Header (Visible only when printing) -->
                <div class="print-header hidden">
                  <div class="flex justify-content-between align-items-center mb-3">
                    <div>
                      <h2>{{ authStore.tenant()?.name || 'My Organization' }}</h2>
                      <p>Corporate Inventory Audit Ledger</p>
                    </div>
                    <img *ngIf="authStore.tenant()?.logo" [src]="authStore.tenant()?.logo" style="max-height: 48px; border-radius: 6px;" />
                  </div>
                  <h3 class="font-bold text-lg mb-1">{{ rep.name }}</h3>
                  <p class="text-xs text-secondary mb-3">Compiled on {{ todayDate | date:'medium' }}</p>
                </div>
                
                <!-- 1. Valuation Report -->
                @if (rep.id === 'val') {
                  <p-table [value]="productStore.products()" class="w-full">
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Product SKU</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th class="text-right">Worth</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-p>
                      <tr>
                        <td><code>{{ p.sku }}</code></td>
                        <td class="font-bold">{{ p.name }}</td>
                        <td>{{ p.price | currency:'USD' }}</td>
                        <td>{{ p.quantity }}</td>
                        <td class="text-right font-bold text-primary">{{ (p.price * p.quantity) | currency:'USD' }}</td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="footer">
                      <tr>
                        <td colspan="3" class="text-right font-bold">Total Valuation:</td>
                        <td class="font-bold">{{ totalStockQty() }}</td>
                        <td class="text-right font-bold text-success">{{ productStore.totalInventoryValue() | currency:'USD' }}</td>
                      </tr>
                    </ng-template>
                  </p-table>
                }

                <!-- 2. Low Stock Alerts -->
                @if (rep.id === 'low') {
                  <p-table [value]="productStore.lowStockProducts()" class="w-full">
                    <ng-template pTemplate="header">
                      <tr>
                        <th>SKU</th>
                        <th>Item</th>
                        <th>Qty In Warehouse</th>
                        <th>Criticality</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-p>
                      <tr>
                        <td><code>{{ p.sku }}</code></td>
                        <td class="font-bold">{{ p.name }}</td>
                        <td class="text-danger font-bold">{{ p.quantity }}</td>
                        <td>
                          <p-tag value="Urgent Replenish" severity="danger"></p-tag>
                        </td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                      <tr>
                        <td colspan="4" class="p-4 text-center text-success font-semibold">
                          <i class="pi pi-check-circle mr-2"></i>All product stock quantities are healthy. No alerts!
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>
                }

                <!-- 3. Warehouse Allocations -->
                @if (rep.id === 'ware') {
                  <p-table [value]="inventoryStore.warehouses()" class="w-full">
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Warehouse ID</th>
                        <th>Location</th>
                        <th>Storage Count</th>
                        <th class="text-right">Valuation</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-w>
                      <tr>
                        <td class="font-bold text-primary">{{ w.name }}</td>
                        <td>{{ w.location }}</td>
                        <td>{{ w.availableQty }} units</td>
                        <td class="text-right font-bold">{{ w.value | currency:'USD' }}</td>
                      </tr>
                    </ng-template>
                  </p-table>
                }

                <!-- 4. User Audit trail -->
                @if (rep.id === 'audit') {
                  <p-table [value]="dashboardStore.recentActivities()" class="w-full">
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Time</th>
                        <th>User</th>
                        <th>Action Log</th>
                        <th>Classification</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-log>
                      <tr>
                        <td class="text-xs text-secondary">{{ log.timestamp | date:'short' }}</td>
                        <td class="font-semibold">{{ log.user }}</td>
                        <td>{{ log.action }}</td>
                        <td>
                          <p-tag [value]="log.type.toUpperCase()" [severity]="log.type"></p-tag>
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>
                }
              </div>
            } @else {
              <div class="flex-grow-1 flex flex-column align-items-center justify-content-center text-center p-4">
                <i class="pi pi-file-pdf text-5xl text-secondary mb-3"></i>
                <h3 class="font-bold">Select Report to Preview</h3>
                <p class="text-xs text-secondary mt-1 max-width-320">Click on any compiled report card on the left panel to display its live database ledger and tools.</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
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

    .border-bottom-1 { border-bottom: 1px solid var(--border-color); }
    .border-color-light { border-color: var(--border-color); }

    // Report cards
    .report-selection-card {
      border: 1px solid var(--border-color);
      background: var(--surface-card);
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(37, 99, 235, 0.04);
        transform: translateX(4px);
      }
      
      &.active {
        border-color: var(--primary-color);
        background: rgba(37, 99, 235, 0.08);
      }
    }
    
    .report-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      i {
        font-size: 1.1rem;
      }
      
      &.success { background: rgba(34, 197, 94, 0.1); color: var(--success-color); }
      &.info { background: rgba(37, 99, 235, 0.1); color: var(--primary-color); }
      &.warn { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
      &.danger { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); }
    }
  `]
})
export class ReportsComponent implements OnInit {
  public productStore = inject(ProductStore);
  public inventoryStore = inject(InventoryStore);
  public userStore = inject(UserStore);
  public dashboardStore = inject(DashboardStore);
  public authStore = inject(AuthStore);
  private messageService = inject(MessageService);

  public selectedReportId = signal<string | null>(null);
  public todayDate = new Date();

  // Exporting flags
  public exportingPdf = signal<boolean>(false);
  public exportingExcel = signal<boolean>(false);

  public reportsDirectory: ReportDefinition[] = [
    { id: 'val', name: 'SKU Inventory Valuation', description: 'Catalog stock quantities and total asset valuations.', icon: 'pi pi-dollar', severity: 'success' },
    { id: 'low', name: 'Low Stock Diagnostic', description: 'Directory of SKUs below safety thresholds.', icon: 'pi pi-exclamation-triangle', severity: 'danger' },
    { id: 'ware', name: 'Warehouse Allocation Report', description: 'Distribution of stock counts across registered warehouses.', icon: 'pi pi-warehouse', severity: 'info' },
    { id: 'audit', name: 'User Activity Audit Log', description: 'System ledger tracking user actions and transaction history.', icon: 'pi pi-history', severity: 'warn' }
  ];

  public activeReport = computed(() => {
    return this.reportsDirectory.find(r => r.id === this.selectedReportId()) || null;
  });

  public totalStockQty = computed(() => {
    return this.productStore.products().reduce((sum, p) => sum + p.quantity, 0);
  });

  public ngOnInit(): void {
    this.productStore.loadProducts();
    this.inventoryStore.loadInventoryData();
    this.userStore.loadUsersAndRoles();
    this.dashboardStore.loadDashboardStats();
  }

  public selectReport(id: string): void {
    this.selectedReportId.set(id);
  }

  public getReportBadgeClass(severity: string): string {
    switch (severity) {
      case 'success': return 'badge-success';
      case 'danger': return 'badge-danger';
      case 'info': return 'badge-info';
      case 'warn': return 'badge-warning';
      default: return 'badge-info';
    }
  }

  public printReport(): void {
    window.print();
  }

  public exportPdf(name: string): void {
    this.exportingPdf.set(true);
    of(null).pipe(
      delay(1200), // Simulate file compile latency
      finalize(() => this.exportingPdf.set(false))
    ).subscribe(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'PDF Compiled',
        detail: `Report '${name}' downloaded successfully.`
      });
    });
  }

  public exportExcel(name: string): void {
    this.exportingExcel.set(true);
    of(null).pipe(
      delay(1000), // Simulate spreadsheet generation
      finalize(() => this.exportingExcel.set(false))
    ).subscribe(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Excel Sheet Exported',
        detail: `Spreadsheet '${name}' saved to downloads.`
      });
    });
  }
}
