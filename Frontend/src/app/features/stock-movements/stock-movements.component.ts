import { Component, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryStore } from '../../stores/inventory.store';
import { ProductStore } from '../../stores/product.store';
import { StockMovement } from '../../core/models/app.models';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';

// PrimeNG Modules
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { Textarea } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-stock-movements',
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
    Select,
    InputTextModule,
    InputNumberModule,
    Textarea,
    ToastModule,
    SelectButtonModule,
    TagModule
  ],
  providers: [MessageService],
  template: `
    <div class="movements-container fade-in">
      <p-toast></p-toast>

      <!-- Page Header -->
      <div class="flex justify-content-between align-items-center mb-3">
        <div>
          <app-breadcrumb></app-breadcrumb>
          <h1 class="page-title">Operations & Stock Movements</h1>
          <p class="page-subtitle">Track receipts, sales shipments, and internal transfers</p>
        </div>
        <div>
          <button pButton 
                  label="Record Stock Transaction" 
                  icon="pi pi-sync" 
                  class="p-button-primary" 
                  (click)="openWizardDialog()">
          </button>
        </div>
      </div>

      <!-- View Selector & Filter bar -->
      <div class="glass-card p-3 mb-4 flex flex-wrap align-items-center justify-content-between gap-3">
        <!-- Tab Select Button -->
        <p-selectButton [options]="viewOptions" 
                        [(ngModel)]="activeView" 
                        optionLabel="label" 
                        optionValue="value" 
                        styleClass="layout-select-button">
        </p-selectButton>

        <div class="flex flex-wrap align-items-center gap-3">
          <!-- Movement Type Filter -->
          <p-select 
            [options]="typeFilterOptions" 
            placeholder="All Types" 
            styleClass="min-w-150"
            (onChange)="onTypeFilterChange($event.value)">
          </p-select>

          <!-- Warehouse Location Filter -->
          <p-select 
            [options]="warehouseFilterOptions()" 
            placeholder="All Warehouses" 
            styleClass="min-w-150"
            (onChange)="onWarehouseFilterChange($event.value)">
          </p-select>

          <button pButton 
                  label="Export Log" 
                  icon="pi pi-file-excel" 
                  class="p-button-outlined p-button-secondary" 
                  (click)="dt.exportCSV()">
          </button>
        </div>
      </div>

      <!-- Displays -->
      @if (inventoryStore.error(); as err) {
        <app-error-state [message]="err" (retry)="loadData()"></app-error-state>
      } @else if (inventoryStore.loading() && inventoryStore.movements().length === 0) {
        <app-skeleton-loader type="table"></app-skeleton-loader>
      } @else {
        <!-- 1. Grid/Table History View -->
        <div *ngIf="activeView === 'grid'">
          <p-table #dt 
                   [value]="inventoryStore.filteredMovements()" 
                   [paginator]="true" 
                   [rows]="10" 
                   [rowsPerPageOptions]="[5, 10, 20]" 
                   [rowHover]="true" 
                   responsiveLayout="scroll"
                   [exportFilename]="'stock_movements_log'"
                   class="w-full">
            
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="movementDate">Timestamp <p-sortIcon field="movementDate"></p-sortIcon></th>
                <th pSortableColumn="productName">Product <p-sortIcon field="productName"></p-sortIcon></th>
                <th pSortableColumn="movementType">Type <p-sortIcon field="movementType"></p-sortIcon></th>
                <th pSortableColumn="quantity">Qty <p-sortIcon field="quantity"></p-sortIcon></th>
                <th pSortableColumn="reference">Reference <p-sortIcon field="reference"></p-sortIcon></th>
                <th>Locations</th>
                <th>Notes</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-movement>
              <tr>
                <td>{{ movement.movementDate | date:'medium' }}</td>
                <td><span class="font-bold text-primary">{{ movement.productName }}</span></td>
                <td>
                  <p-tag [value]="movement.movementType" [severity]="getTypeSeverity(movement.movementType)"></p-tag>
                </td>
                <td class="font-semibold">{{ movement.quantity }}</td>
                <td><code class="ref-badge">{{ movement.reference }}</code></td>
                <td>
                  <span class="text-xs font-medium">
                    @if (movement.movementType === 'STOCK_IN') {
                      <i class="pi pi-arrow-circle-down text-success mr-1"></i> To: {{ movement.toWarehouse }}
                    } @else if (movement.movementType === 'STOCK_OUT') {
                      <i class="pi pi-arrow-circle-up text-danger mr-1"></i> From: {{ movement.fromWarehouse }}
                    } @else if (movement.movementType === 'TRANSFER') {
                      <i class="pi pi-arrow-right text-primary mr-1"></i> {{ movement.fromWarehouse }} &rarr; {{ movement.toWarehouse }}
                    }
                  </span>
                </td>
                <td class="text-secondary">{{ movement.notes }}</td>
              </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7">
                  <app-empty-state 
                    title="No Movements Logged" 
                    description="Record a new transaction to see transaction logs."
                    icon="pi pi-sync">
                  </app-empty-state>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- 2. Vertical Timeline View -->
        <div *ngIf="activeView === 'timeline'" class="timeline-view-wrapper fade-in">
          @if (inventoryStore.filteredMovements().length === 0) {
            <app-empty-state 
              title="No Timeline Records" 
              description="Adjust filters or add a movement to populate this timeline."
              icon="pi pi-calendar-times">
            </app-empty-state>
          } @else {
            <div class="custom-timeline mt-4">
              @for (m of inventoryStore.filteredMovements(); track m.id) {
                <div class="timeline-node">
                  <div class="timeline-badge" [class]="m.movementType">
                    <i [class]="getTimelineIcon(m.movementType)"></i>
                  </div>
                  <div class="timeline-card glass-card p-3">
                    <div class="flex justify-content-between align-items-center mb-2">
                      <span class="timeline-product font-bold">{{ m.productName }}</span>
                      <span class="timeline-date text-xs text-secondary">{{ m.movementDate | date:'medium' }}</span>
                    </div>
                    <div class="flex align-items-center gap-2 mb-2">
                      <p-tag [value]="m.movementType" [severity]="getTypeSeverity(m.movementType)"></p-tag>
                      <span class="text-sm font-semibold">Quantity: {{ m.quantity }} units</span>
                    </div>
                    <p class="timeline-notes text-secondary text-sm mb-2">{{ m.notes }}</p>
                    <div class="timeline-meta flex justify-content-between align-items-center mt-3 pt-2 border-top-1 border-color-light text-xs text-secondary">
                      <span>Ref: <code>{{ m.reference }}</code></span>
                      <span>
                        @if (m.movementType === 'STOCK_IN') {
                          Received in <strong>{{ m.toWarehouse }}</strong>
                        } @else if (m.movementType === 'STOCK_OUT') {
                          Dispatched from <strong>{{ m.fromWarehouse }}</strong>
                        } @else {
                          Moved: <strong>{{ m.fromWarehouse }}</strong> &rarr; <strong>{{ m.toWarehouse }}</strong>
                        }
                      </span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Record Transaction Wizard Dialog Modal -->
      <p-dialog [(visible)]="displayWizardDialog" 
                header="Record Stock Transaction" 
                [modal]="true" 
                styleClass="responsive-modal-dialog"
                contentStyleClass="p-fluid">
        
        <form [formGroup]="movementForm" class="p-fluid pt-2">
          <!-- Product Selector -->
          <div class="field mb-3">
            <label for="product" class="font-semibold block mb-2">Select Catalog SKU</label>
            <p-select id="product" 
                        [options]="productOptions()" 
                        formControlName="productId" 
                        placeholder="Choose SKU to modify" 
                        filter="true" 
                        styleClass="w-full">
            </p-select>
            @if (movementForm.get('productId')?.touched && movementForm.get('productId')?.invalid) {
              <small class="p-error">Product SKU is required.</small>
            }
          </div>

          <!-- Movement Type Selection -->
          <div class="field mb-3">
            <label class="font-semibold block mb-2">Transaction Type</label>
            <p-selectButton [options]="movementTypeOptions" 
                            formControlName="movementType" 
                            styleClass="w-full select-button-three-way">
            </p-selectButton>
          </div>

          <!-- Quantity & Reference Grid -->
          <div class="grid">
            <div class="col-12 md:col-6 field mb-3">
              <label for="qty" class="font-semibold block mb-2">Quantity (units)</label>
              <p-inputNumber id="qty" 
                             formControlName="quantity" 
                             [min]="1" 
                             placeholder="e.g. 50">
              </p-inputNumber>
              @if (movementForm.get('quantity')?.touched && movementForm.get('quantity')?.invalid) {
                <small class="p-error">Quantity must be at least 1.</small>
              }
            </div>
            <div class="col-12 md:col-6 field mb-3">
              <label for="ref" class="font-semibold block mb-2">Reference Code</label>
              <input id="ref" type="text" pInputText formControlName="reference" placeholder="e.g. PO-2026-891" />
              @if (movementForm.get('reference')?.touched && movementForm.get('reference')?.invalid) {
                <small class="p-error">Reference identifier is required.</small>
              }
            </div>
          </div>

          <!-- Warehouses (Dynamic based on Type) -->
          <div class="grid">
            <!-- Source Warehouse (Visible for OUT and TRANSFER) -->
            <div class="col-12 md:col-6 field mb-3" *ngIf="showFromWarehouse()">
              <label for="fromWh" class="font-semibold block mb-2">Source Warehouse</label>
              <p-select id="fromWh" 
                          [options]="formWarehouseOptions()" 
                          formControlName="fromWarehouse" 
                          placeholder="Select origin" 
                          styleClass="w-full">
              </p-select>
              @if (movementForm.get('fromWarehouse')?.touched && movementForm.get('fromWarehouse')?.invalid) {
                <small class="p-error">Source location is required.</small>
              }
            </div>
            <!-- Destination Warehouse (Visible for IN and TRANSFER) -->
            <div class="col-12 md:col-6 field mb-3" *ngIf="showToWarehouse()">
              <label for="toWh" class="font-semibold block mb-2">Destination Warehouse</label>
              <p-select id="toWh" 
                          [options]="formWarehouseOptions()" 
                          formControlName="toWarehouse" 
                          placeholder="Select destination" 
                          styleClass="w-full">
              </p-select>
              @if (movementForm.get('toWarehouse')?.touched && movementForm.get('toWarehouse')?.invalid) {
                <small class="p-error">Destination location is required.</small>
              }
            </div>
          </div>

          <!-- Notes -->
          <div class="field mb-4">
            <label for="notes" class="font-semibold block mb-2">Operational Notes</label>
            <textarea id="notes" 
                      pTextarea 
                      formControlName="notes" 
                      rows="3" 
                      placeholder="Add descriptions or comments..."></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-content-end gap-2">
            <button pButton 
                    type="button" 
                    label="Discard" 
                    class="p-button-outlined p-button-secondary" 
                    (click)="closeWizardDialog()">
            </button>
            <button pButton 
                    type="submit" 
                    label="Execute Transaction" 
                    class="p-button-primary" 
                    [disabled]="movementForm.invalid"
                    (click)="onSaveMovement()">
            </button>
          </div>
        </form>
      </p-dialog>
    </div>
  `,
  styles: [`
    .movements-container {
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

    .min-w-150 {
      min-width: 150px;
    }

    .ref-badge {
      background: rgba(226, 232, 240, 0.5);
      border: 1px solid var(--border-color);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-family: monospace;
      color: var(--text-color);
    }

    body.dark-theme .ref-badge {
      background: rgba(30, 41, 59, 0.5);
    }

    .border-top-1 { border-top: 1px solid var(--border-color); }
    .border-color-light { border-color: var(--border-color); }

    // Custom Vertical Timeline
    .custom-timeline {
      position: relative;
      padding: 1rem 0;
      
      &::before {
        content: '';
        position: absolute;
        left: 20px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--border-color);
      }
    }
    
    .timeline-node {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
      position: relative;
      
      .timeline-badge {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-color);
        border: 2px solid var(--border-color);
        z-index: 1;
        flex-shrink: 0;
        box-shadow: var(--shadow-sm);
        
        i {
          font-size: 0.95rem;
        }
        
        &.STOCK_IN {
          border-color: var(--success-color);
          color: var(--success-color);
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.2);
        }
        
        &.STOCK_OUT {
          border-color: var(--danger-color);
          color: var(--danger-color);
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.2);
        }
        
        &.TRANSFER {
          border-color: var(--primary-color);
          color: var(--primary-color);
          box-shadow: 0 0 8px rgba(37, 99, 235, 0.2);
        }
      }
      
      .timeline-card {
        flex: 1;
        border-radius: 12px;
      }
    }

    ::ng-deep .layout-select-button {
      .p-button {
        padding: 0.5rem 1rem !important;
        font-size: 0.825rem !important;
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

    ::ng-deep .select-button-three-way {
      display: flex;
      
      .p-button {
        flex: 1;
        text-align: center;
        justify-content: center;
      }
    }
  `]
})
export class StockMovementsComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  public inventoryStore = inject(InventoryStore);
  public productStore = inject(ProductStore);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  public activeView = 'grid'; // Toggle between 'grid' and 'timeline'
  public displayWizardDialog = false;
  public movementForm!: FormGroup;

  public viewOptions = [
    { label: 'History Ledger', value: 'grid' },
    { label: 'Activity Timeline', value: 'timeline' }
  ];

  public typeFilterOptions = [
    { label: 'All Transactions', value: 'All' },
    { label: 'Stock In', value: 'STOCK_IN' },
    { label: 'Stock Out', value: 'STOCK_OUT' },
    { label: 'Internal Transfer', value: 'TRANSFER' }
  ];

  public movementTypeOptions = [
    { label: 'Stock In (Receipt)', value: 'STOCK_IN' },
    { label: 'Stock Out (Sale/Loss)', value: 'STOCK_OUT' },
    { label: 'Internal Transfer', value: 'TRANSFER' }
  ];

  // Map warehouses in store to filters
  public warehouseFilterOptions = computed(() => {
    return [
      { label: 'All Locations', value: 'All' },
      ...this.inventoryStore.warehouses().map(w => ({ label: w.name, value: w.name }))
    ];
  });

  // Map products to select options
  public productOptions = computed(() => {
    return this.productStore.products()
      .filter(p => p.status === 'Active')
      .map(p => ({ label: `${p.name} (SKU: ${p.sku})`, value: p.id }));
  });

  // Map warehouses for dialog options
  public formWarehouseOptions = computed(() => {
    return this.inventoryStore.warehouses().map(w => ({ label: w.name, value: w.name }));
  });

  public ngOnInit(): void {
    this.loadData();
    this.initForm();
  }

  public loadData(): void {
    this.inventoryStore.loadInventoryData();
    this.productStore.loadProducts();
  }

  private initForm(): void {
    this.movementForm = this.fb.group({
      productId: [null, Validators.required],
      movementType: ['STOCK_IN', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reference: ['', Validators.required],
      notes: [''],
      fromWarehouse: [null],
      toWarehouse: [null]
    });

    // Handle warehouse validator rules reactively based on selected type
    this.movementForm.get('movementType')?.valueChanges.subscribe((type) => {
      this.updateWarehouseValidators(type);
    });
  }

  private updateWarehouseValidators(type: string): void {
    const fromWh = this.movementForm.get('fromWarehouse');
    const toWh = this.movementForm.get('toWarehouse');

    fromWh?.clearValidators();
    toWh?.clearValidators();

    const currentWhs = this.formWarehouseOptions();
    const defaultWh = currentWhs[0]?.value || null;

    if (type === 'STOCK_IN') {
      toWh?.setValidators(Validators.required);
      toWh?.setValue(defaultWh);
      fromWh?.setValue(null);
    } else if (type === 'STOCK_OUT') {
      fromWh?.setValidators(Validators.required);
      fromWh?.setValue(defaultWh);
      toWh?.setValue(null);
    } else if (type === 'TRANSFER') {
      fromWh?.setValidators(Validators.required);
      toWh?.setValidators(Validators.required);
      fromWh?.setValue(currentWhs[0]?.value || null);
      toWh?.setValue(currentWhs[1]?.value || currentWhs[0]?.value || null);
    }

    fromWh?.updateValueAndValidity();
    toWh?.updateValueAndValidity();
  }

  public showFromWarehouse(): boolean {
    const type = this.movementForm.get('movementType')?.value;
    return type === 'STOCK_OUT' || type === 'TRANSFER';
  }

  public showToWarehouse(): boolean {
    const type = this.movementForm.get('movementType')?.value;
    return type === 'STOCK_IN' || type === 'TRANSFER';
  }

  public getTypeSeverity(type: string): 'success' | 'danger' | 'info' {
    switch (type) {
      case 'STOCK_IN': return 'success';
      case 'STOCK_OUT': return 'danger';
      case 'TRANSFER': return 'info';
      default: return 'info';
    }
  }

  public getTimelineIcon(type: string): string {
    switch (type) {
      case 'STOCK_IN': return 'pi pi-arrow-down-left';
      case 'STOCK_OUT': return 'pi pi-arrow-up-right';
      case 'TRANSFER': return 'pi pi-arrow-right';
      default: return 'pi pi-sync';
    }
  }

  public onTypeFilterChange(value: string): void {
    this.inventoryStore.movementTypeFilter.set(value);
  }

  public onWarehouseFilterChange(value: string): void {
    this.inventoryStore.warehouseFilter.set(value);
  }

  public openWizardDialog(): void {
    this.initForm();
    const currentProducts = this.productOptions();
    if (currentProducts.length > 0) {
      this.movementForm.patchValue({ productId: currentProducts[0].value });
    }
    this.updateWarehouseValidators('STOCK_IN');
    this.displayWizardDialog = true;
  }

  public closeWizardDialog(): void {
    this.displayWizardDialog = false;
  }

  public onSaveMovement(): void {
    if (this.movementForm.invalid) return;

    const formVal = this.movementForm.value;

    this.inventoryStore.createMovement(formVal, () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Transaction Authorized',
        detail: `Successfully processed ${formVal.movementType} for ${formVal.quantity} units.`
      });
      // Refresh products store to reflect quantity changes
      this.productStore.loadProducts();
      this.closeWizardDialog();
    });
  }
}
