import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryStore } from '../../stores/inventory.store';
import { ProductStore } from '../../stores/product.store';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { ProgressBarModule } from 'primeng/progressbar';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-inventory-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BreadcrumbComponent,
    SkeletonLoaderComponent,
    ErrorStateComponent,
    ProgressBarModule,
    CardModule,
    TableModule,
    TagModule,
    DialogModule,
    ButtonModule,
    InputTextModule
  ],
  template: `
    <div class="inventory-overview-container fade-in">
      
      <!-- Page Header -->
      <div class="flex justify-content-between align-items-center mb-3">
        <div>
          <app-breadcrumb></app-breadcrumb>
          <h1 class="page-title">Warehouse Inventory overview</h1>
          <p class="page-subtitle">Track locations, warehouse stock distributions, and asset values</p>
        </div>
      </div>

      <!-- State Checker -->
      @if (inventoryStore.error(); as err) {
        <app-error-state [message]="err" (retry)="loadData()"></app-error-state>
      } @else if (inventoryStore.loading() && inventoryStore.warehouses().length === 0) {
        <div class="grid mb-4">
          @for (card of [1, 2, 3]; track $index) {
            <div class="col-12 md:col-4">
              <app-skeleton-loader type="card"></app-skeleton-loader>
            </div>
          }
        </div>
        <app-skeleton-loader type="table"></app-skeleton-loader>
      } @else {
        <!-- Dynamic KPIs Grid -->
        <div class="grid mb-4">
          <!-- Total Warehouses -->
          <div class="col-12 md:col-4">
            <div class="kpi-card glass-card">
              <div class="kpi-icon-container info">
                <i class="pi pi-warehouse"></i>
              </div>
              <div class="kpi-info">
                <span class="kpi-label">Active Warehouses</span>
                <h2 class="kpi-value">{{ inventoryStore.warehouses().length }}</h2>
                <span class="kpi-subtext">Registered depots</span>
              </div>
            </div>
          </div>

          <!-- Total Items Quantity -->
          <div class="col-12 md:col-4">
            <div class="kpi-card glass-card">
              <div class="kpi-icon-container success">
                <i class="pi pi-box"></i>
              </div>
              <div class="kpi-info">
                <span class="kpi-label">Available Units</span>
                <h2 class="kpi-value">{{ totalQty() | number }}</h2>
                <span class="kpi-subtext">Aggregated stock units</span>
              </div>
            </div>
          </div>

          <!-- Total Inventory Valuation -->
          <div class="col-12 md:col-4">
            <div class="kpi-card glass-card">
              <div class="kpi-icon-container warning">
                <i class="pi pi-dollar"></i>
              </div>
              <div class="kpi-info">
                <span class="kpi-label">Aggregate Assets Value</span>
                <h2 class="kpi-value">{{ productStore.totalInventoryValue() | currency:'USD' }}</h2>
                <span class="kpi-subtext">Sum of SKU assets value</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid mb-4">
          <!-- Warehouses List -->
          <div class="col-12 lg:col-5">
            <div class="glass-card p-4 h-full">
              <div class="flex justify-content-between align-items-center mb-3">
                <div>
                  <h3 class="section-title mb-1">Warehouse Hubs</h3>
                  <p class="section-desc">Individual warehouse capacity and asset values</p>
                </div>
                <button pButton 
                        icon="pi pi-plus" 
                        label="New Depot" 
                        class="p-button-outlined p-button-sm p-button-primary"
                        (click)="openAddDialog()">
                </button>
              </div>
              
              <div class="flex flex-column gap-4">
                @for (wh of inventoryStore.warehouses(); track wh.id) {
                  <div class="warehouse-row p-3 border-round border-1 border-color-light">
                    <div class="flex justify-content-between align-items-start mb-2">
                      <div>
                        <h4 class="warehouse-name font-bold mb-1">{{ wh.name }}</h4>
                        <span class="warehouse-loc text-xs text-secondary"><i class="pi pi-map-marker mr-1"></i>{{ wh.location }}</span>
                      </div>
                      <div class="flex align-items-center gap-2">
                        <span class="warehouse-value font-bold text-primary mr-2">{{ wh.value | currency:'USD':'symbol':'1.0-0' }}</span>
                        @if (inventoryStore.warehouses().length > 1) {
                          <button pButton 
                                  icon="pi pi-trash" 
                                  class="p-button-text p-button-danger p-button-sm p-0"
                                  style="width: 24px; height: 24px;"
                                  (click)="deleteWarehouse(wh.id!)">
                          </button>
                        }
                      </div>
                    </div>
                    
                    <div class="flex justify-content-between align-items-center mb-1 text-xs mt-3">
                      <span class="text-secondary">Stock Allocation:</span>
                      <span class="font-bold">{{ wh.availableQty }} / 1,000 units</span>
                    </div>
                    <p-progressBar [value]="(wh.availableQty / 1000) * 100" [showValue]="false" styleClass="wh-progress-bar"></p-progressBar>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Product Stock Level Health Check -->
          <div class="col-12 lg:col-7">
            <div class="glass-card p-4 h-full">
              <h3 class="section-title mb-3">Inventory Stock Level Health Check</h3>
              <p class="section-desc mb-4">Real-time listing quantities, status, and health indicators</p>
              
              <p-table [value]="productStore.products()" [rows]="5" [paginator]="true" class="w-full">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Available</th>
                    <th>Safety Health</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-product>
                  <tr>
                    <td><span class="font-semibold">{{ product.name }}</span></td>
                    <td><code class="sku-code">{{ product.sku }}</code></td>
                    <td>{{ product.quantity }}</td>
                    <td>
                      <span class="badge" [class]="getQuantityHealthClass(product.quantity)">
                        {{ getQuantityHealthLabel(product.quantity) }}
                      </span>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </div>
        </div>
      }

      <!-- Add Warehouse Dialog -->
      <p-dialog [(visible)]="displayAddDialog" 
                header="Add New Warehouse Depot" 
                [modal]="true" 
                styleClass="responsive-modal-dialog"
                contentStyleClass="p-fluid">
        
        <form [formGroup]="warehouseForm" (ngSubmit)="onSaveWarehouse()" class="p-fluid pt-2">
          <div class="field mb-3">
            <label for="whName" class="font-semibold block mb-2">Warehouse Name</label>
            <input id="whName" type="text" pInputText formControlName="name" placeholder="e.g. West Coast Hub" />
            @if (warehouseForm.get('name')?.touched && warehouseForm.get('name')?.invalid) {
              <small class="p-error">Warehouse name is required.</small>
            }
          </div>

          <div class="field mb-4">
            <label for="whLoc" class="font-semibold block mb-2">Location / Address</label>
            <input id="whLoc" type="text" pInputText formControlName="location" placeholder="e.g. Seattle, WA" />
            @if (warehouseForm.get('location')?.touched && warehouseForm.get('location')?.invalid) {
              <small class="p-error">Location is required.</small>
            }
          </div>

          <div class="flex justify-content-end gap-2 mt-2">
            <button pButton 
                    type="button" 
                    label="Cancel" 
                    class="p-button-outlined p-button-secondary" 
                    (click)="displayAddDialog = false">
            </button>
            <button pButton 
                    type="submit" 
                    label="Add Warehouse" 
                    class="p-button-primary" 
                    [disabled]="warehouseForm.invalid">
            </button>
          </div>
        </form>
      </p-dialog>
    </div>
  `,
  styles: [`
    .inventory-overview-container {
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

    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0;
    }

    .section-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .warehouse-row {
      border: 1px solid var(--border-color);
      background: rgba(255, 255, 255, 0.02);
      
      .warehouse-name {
        font-size: 0.9rem;
        color: var(--text-color);
      }
    }

    .sku-code {
      background: rgba(226, 232, 240, 0.5);
      border: 1px solid var(--border-color);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-family: monospace;
      color: var(--text-color);
    }

    body.dark-theme .sku-code {
      background: rgba(30, 41, 59, 0.5);
    }

    ::ng-deep .wh-progress-bar {
      height: 6px !important;
      background: rgba(226, 232, 240, 0.5) !important;
      
      .p-progressbar-value {
        background: var(--primary-color) !important;
      }
    }

    body.dark-theme ::ng-deep .wh-progress-bar {
      background: rgba(30, 41, 59, 0.5) !important;
    }
  `]
})
export class InventoryOverviewComponent implements OnInit {
  public inventoryStore = inject(InventoryStore);
  public productStore = inject(ProductStore);
  private fb = inject(FormBuilder);

  public displayAddDialog = false;
  public warehouseForm!: FormGroup;

  // Computes aggregate stock quantity from catalog
  public totalQty = computed(() => 
    this.productStore.products().reduce((sum, p) => sum + p.quantity, 0)
  );

  public ngOnInit(): void {
    this.warehouseForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required]
    });
    this.loadData();
  }

  public loadData(): void {
    this.inventoryStore.loadInventoryData();
    this.productStore.loadProducts();
  }

  public openAddDialog(): void {
    this.warehouseForm.reset();
    this.displayAddDialog = true;
  }

  public onSaveWarehouse(): void {
    if (this.warehouseForm.invalid) return;
    this.inventoryStore.saveWarehouse(this.warehouseForm.value, () => {
      this.displayAddDialog = false;
    });
  }

  public deleteWarehouse(id: number): void {
    if (confirm('Are you sure you want to delete this warehouse?')) {
      this.inventoryStore.deleteWarehouse(id);
    }
  }

  public getQuantityHealthClass(qty: number): string {
    if (qty > 20) return 'badge-success';
    if (qty > 0 && qty <= 10) return 'badge-warning';
    return 'badge-danger';
  }

  public getQuantityHealthLabel(qty: number): string {
    if (qty > 20) return 'Healthy';
    if (qty > 0 && qty <= 10) return 'Warning';
    return 'Critical';
  }
}
