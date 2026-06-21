import { Component, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductStore } from '../../stores/product.store';
import { CategoryStore } from '../../stores/category.store';
import { Product, Category } from '../../core/models/app.models';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';

// PrimeNG Modules
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { Textarea } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-products',
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
    InputNumberModule,
    Textarea,
    Select,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="products-container fade-in">
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>

      <!-- Page Header -->
      <div class="flex justify-content-between align-items-center mb-3">
        <div>
          <app-breadcrumb></app-breadcrumb>
          <h1 class="page-title">Products Directory</h1>
          <p class="page-subtitle">Add, manage, and catalog SKUs inside your tenant workspace</p>
        </div>
        <div>
          <button pButton 
                  label="New SKU Listing" 
                  icon="pi pi-plus" 
                  class="p-button-primary" 
                  (click)="openCreateDialog()">
          </button>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="glass-card p-3 mb-4 flex flex-wrap align-items-center justify-content-between gap-3">
        <div class="flex align-items-center gap-2 flex-grow-1 max-width-320">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search"></i>
            <input pInputText 
                   type="text" 
                   class="w-full" 
                   [placeholder]="'Search by SKU, name...'" 
                   (input)="onSearch($event)" />
          </span>
        </div>

        <div class="flex flex-wrap align-items-center gap-3">
          <!-- Category Filter -->
          <p-select 
            [options]="categoryOptions()" 
            placeholder="Filter Category" 
            styleClass="min-w-150" 
            (onChange)="onCategoryFilterChange($event.value)">
          </p-select>

          <!-- Status Filter -->
          <p-select 
            [options]="statusOptions" 
            placeholder="Filter Status" 
            styleClass="min-w-150" 
            (onChange)="onStatusFilterChange($event.value)">
          </p-select>

          <!-- CSV Export -->
          <button pButton 
                  label="Export CSV" 
                  icon="pi pi-file-excel" 
                  class="p-button-outlined p-button-secondary" 
                  (click)="dt.exportCSV()">
          </button>

          <!-- Bulk Delete (Visible only when rows selected) -->
          @if (selectedProducts.length > 0) {
            <button pButton 
                    label="Delete Selected ({{ selectedProducts.length }})" 
                    icon="pi pi-trash" 
                    class="p-button-danger" 
                    (click)="deleteSelectedProducts()">
            </button>
          }
        </div>
      </div>

      <!-- Main Display -->
      @if (productStore.error(); as err) {
        <app-error-state [message]="err" (retry)="productStore.loadProducts()"></app-error-state>
      } @else if (productStore.loading() && productStore.totalProductsCount() === 0) {
        <app-skeleton-loader type="table"></app-skeleton-loader>
      } @else {
        <!-- Products Table -->
        <p-table #dt 
                 [value]="productStore.filteredProducts()" 
                 [(selection)]="selectedProducts" 
                 [paginator]="true" 
                 [rows]="10" 
                 [rowsPerPageOptions]="[5, 10, 20]" 
                 [rowHover]="true" 
                 dataKey="id" 
                 responsiveLayout="scroll"
                 [exportFilename]="'products_catalog_export'"
                 class="w-full">
          
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 4rem">
                <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
              </th>
              <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
              <th pSortableColumn="sku">SKU <p-sortIcon field="sku"></p-sortIcon></th>
              <th pSortableColumn="categoryId">Category <p-sortIcon field="categoryId"></p-sortIcon></th>
              <th pSortableColumn="price">Price <p-sortIcon field="price"></p-sortIcon></th>
              <th pSortableColumn="quantity">Qty <p-sortIcon field="quantity"></p-sortIcon></th>
              <th pSortableColumn="status">Status <p-sortIcon field="status"></p-sortIcon></th>
              <th style="width: 8rem">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-product>
            <tr>
              <td>
                <p-tableCheckbox [value]="product"></p-tableCheckbox>
              </td>
              <td>
                <div class="flex align-items-center gap-2">
                  <img [src]="product.imageUrl || 'https://via.placeholder.com/40'" 
                       alt="Product Image" 
                       class="product-table-img" />
                  <span class="font-medium">{{ product.name }}</span>
                </div>
              </td>
              <td>
                <code class="sku-badge">{{ product.sku }}</code>
              </td>
              <td>
                {{ getCategoryName(product.categoryId) }}
              </td>
              <td>
                {{ product.price | currency:'USD' }}
              </td>
              <td>
                <span class="qty-indicator" 
                      [class.text-danger]="product.quantity === 0" 
                      [class.text-warning]="product.quantity > 0 && product.quantity <= 10">
                  {{ product.quantity }}
                </span>
              </td>
              <td>
                <p-tag [value]="product.status" [severity]="getStatusSeverity(product.status)"></p-tag>
              </td>
              <td>
                <div class="flex gap-2">
                  <button pButton 
                          icon="pi pi-pencil" 
                          class="p-button-rounded p-button-text p-button-secondary" 
                          (click)="openEditDialog(product)">
                  </button>
                  <button pButton 
                          icon="pi pi-trash" 
                          class="p-button-rounded p-button-text p-button-danger" 
                          (click)="confirmDeleteProduct(product)">
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>

          <!-- Empty State Inside Table -->
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8">
                <app-empty-state 
                  title="No SKUs Found" 
                  description="We could not find any products in this workspace. Create a new SKU listing to start."
                  icon="pi pi-box"
                  actionLabel="Create Product"
                  (actionClicked)="openCreateDialog()">
                </app-empty-state>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }

      <!-- Add/Edit Product Modal Dialog -->
      <p-dialog [(visible)]="displayFormDialog" 
                [header]="isEditMode() ? 'Modify SKU Details' : 'Create New SKU listing'" 
                [modal]="true" 
                [closable]="true"
                styleClass="responsive-modal-dialog"
                contentStyleClass="p-fluid">
        
        <form [formGroup]="productForm" class="p-fluid pt-2">
          <!-- Name -->
          <div class="field mb-3">
            <label for="name" class="font-semibold block mb-2">Product Title</label>
            <input id="name" type="text" pInputText formControlName="name" placeholder="e.g. iPad Pro M4" />
            @if (productForm.get('name')?.touched && productForm.get('name')?.invalid) {
              <small class="p-error">Product name is required.</small>
            }
          </div>

          <!-- SKU & Category Grid -->
          <div class="grid">
            <div class="col-12 md:col-6 field mb-3">
              <label for="sku" class="font-semibold block mb-2">SKU Code</label>
              <input id="sku" type="text" pInputText formControlName="sku" placeholder="e.g. APL-IPP11M4" />
              @if (productForm.get('sku')?.touched && productForm.get('sku')?.invalid) {
                <small class="p-error">SKU ID identifier is required.</small>
              }
            </div>
            <div class="col-12 md:col-6 field mb-3">
              <label for="category" class="font-semibold block mb-2">Category</label>
              <p-select id="category" 
                          [options]="formCategoryOptions" 
                          formControlName="categoryId" 
                          placeholder="Select category" 
                          styleClass="w-full">
              </p-select>
              @if (productForm.get('categoryId')?.touched && productForm.get('categoryId')?.invalid) {
                <small class="p-error">Please assign a category.</small>
              }
            </div>
          </div>

          <!-- Description -->
          <div class="field mb-3">
            <label for="description" class="font-semibold block mb-2">Description</label>
            <textarea id="description" 
                      pTextarea 
                      formControlName="description" 
                      rows="3" 
                      placeholder="Specify features, dimensions, specifications..."></textarea>
          </div>

          <!-- Price & Quantity Grid -->
          <div class="grid">
            <div class="col-12 md:col-6 field mb-3">
              <label for="price" class="font-semibold block mb-2">Selling Price</label>
              <p-inputNumber id="price" 
                             formControlName="price" 
                             mode="currency" 
                             currency="USD" 
                             locale="en-US" 
                             [min]="0" 
                             placeholder="$0.00">
              </p-inputNumber>
              @if (productForm.get('price')?.touched && productForm.get('price')?.invalid) {
                <small class="p-error">Price must be greater than or equal to 0.</small>
              }
            </div>
            <div class="col-12 md:col-6 field mb-3">
              <label for="quantity" class="font-semibold block mb-2">Starting Stock</label>
              <p-inputNumber id="quantity" 
                             formControlName="quantity" 
                             [min]="0" 
                             placeholder="0">
              </p-inputNumber>
              @if (productForm.get('quantity')?.touched && productForm.get('quantity')?.invalid) {
                <small class="p-error">Stock count is required.</small>
              }
            </div>
          </div>

          <!-- Image URL & Status -->
          <div class="grid">
            <div class="col-12 md:col-8 field mb-3">
              <label for="imageUrl" class="font-semibold block mb-2">Product Image</label>
              <div class="flex gap-2">
                <input id="imageUrl" type="text" pInputText formControlName="imageUrl" placeholder="https://..." class="flex-grow-1" />
                <button pButton 
                        type="button" 
                        icon="pi pi-upload" 
                        class="p-button-outlined"
                        (click)="fileInput.click()">
                </button>
                <input #fileInput 
                       type="file" 
                       style="display: none" 
                       accept="image/*" 
                       (change)="onProductImageUpload($event)" />
              </div>
              @if (uploadingImage()) {
                <small class="text-primary block mt-1"><i class="pi pi-spin pi-spinner mr-1"></i>Uploading image...</small>
              }
            </div>
            <div class="col-12 md:col-4 field mb-4">
              <label for="status" class="font-semibold block mb-2">Status</label>
              <p-select id="status" 
                          [options]="formStatusOptions" 
                          formControlName="status">
              </p-select>
            </div>
          </div>

          <!-- Form Buttons -->
          <div class="flex justify-content-end gap-2 mt-2">
            <button pButton 
                    type="button" 
                    label="Cancel" 
                    class="p-button-outlined p-button-secondary" 
                    (click)="closeDialog()">
            </button>
            <button pButton 
                    type="submit" 
                    label="Save Product" 
                    class="p-button-primary" 
                    [disabled]="productForm.invalid"
                    (click)="onSaveProduct()">
            </button>
          </div>
        </form>
      </p-dialog>
    </div>
  `,
  styles: [`
    .products-container {
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

    .min-w-150 {
      min-width: 150px;
    }
    
    .product-table-img {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      object-fit: cover;
      border: 1px solid var(--border-color);
    }
    
    .sku-badge {
      background: rgba(226, 232, 240, 0.5);
      border: 1px solid var(--border-color);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-color);
    }

    body.dark-theme {
      .sku-badge {
        background: rgba(30, 41, 59, 0.5);
      }
    }

    .qty-indicator {
      font-weight: 600;
    }

    ::ng-deep .responsive-modal-dialog {
      width: 90%;
      max-width: 600px;
      border-radius: 16px !important;
      background: var(--surface-card) !important;
      backdrop-filter: blur(16px) !important;
      border: 1px solid var(--border-color) !important;
      color: var(--text-color) !important;
      
      .p-dialog-header {
        background: transparent !important;
        border-bottom: 1px solid var(--border-color) !important;
        color: var(--text-color) !important;
        padding: 1.25rem 1.5rem !important;
      }
      
      .p-dialog-content {
        background: transparent !important;
        padding: 1.5rem !important;
      }
      
      .p-dialog-header-icon {
        color: var(--text-secondary) !important;
        &:hover {
          background: rgba(37, 99, 235, 0.1) !important;
          color: var(--primary-color) !important;
        }
      }
    }
  `]
})
export class ProductsComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  public productStore = inject(ProductStore);
  public categoryStore = inject(CategoryStore);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private http = inject(HttpClient);

  public selectedProducts: Product[] = [];
  public displayFormDialog = false;
  public isEditMode = signal<boolean>(false);
  public uploadingImage = signal<boolean>(false);
  public productForm!: FormGroup;

  // Static options for dropdown filters
  public statusOptions = [
    { label: 'All Statuses', value: 'All' },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Draft', value: 'Draft' }
  ];

  public formStatusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Draft', value: 'Draft' }
  ];

  // Map of categories for category filter
  public categoryOptions = computed(() => {
    const list = this.categoryStore.categories();
    return [
      { label: 'All Categories', value: null },
      ...list.map(c => ({ label: c.name, value: c.id }))
    ];
  });

  // Map of categories for dialog select
  public get formCategoryOptions() {
    return this.categoryStore.categories().map(c => ({ label: c.name, value: c.id }));
  }

  public ngOnInit(): void {
    this.productStore.loadProducts();
    this.categoryStore.loadCategories();

    this.productForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      sku: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      imageUrl: [''],
      status: ['Active', Validators.required]
    });
  }

  // Resolves name of category in grid row
  public getCategoryName(categoryId: number): string {
    const cat = this.categoryStore.categories().find(c => c.id === categoryId);
    return cat ? cat.name : 'Unknown';
  }

  public getStatusSeverity(status: string): 'success' | 'danger' | 'warn' | 'secondary' {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'danger';
      case 'Draft': return 'secondary';
      default: return 'secondary';
    }
  }

  public onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.productStore.searchQuery.set(input.value);
  }

  public onCategoryFilterChange(value: number | null): void {
    this.productStore.categoryFilter.set(value);
  }

  public onStatusFilterChange(value: string): void {
    this.productStore.statusFilter.set(value);
  }

  public openCreateDialog(): void {
    this.isEditMode.set(false);
    this.productForm.reset({
      id: null,
      name: '',
      sku: '',
      description: '',
      price: 0,
      quantity: 0,
      categoryId: this.formCategoryOptions[0]?.value || null,
      imageUrl: '',
      status: 'Active'
    });
    this.displayFormDialog = true;
  }

  public openEditDialog(product: Product): void {
    this.isEditMode.set(true);
    this.productForm.setValue({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      price: product.price,
      quantity: product.quantity,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl || '',
      status: product.status
    });
    this.displayFormDialog = true;
  }

  public closeDialog(): void {
    this.displayFormDialog = false;
  }

  public onSaveProduct(): void {
    if (this.productForm.invalid) return;

    const formVal = this.productForm.value;
    
    // Set default placeholder image if empty
    if (!formVal.imageUrl) {
      formVal.imageUrl = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60';
    }

    this.productStore.saveProduct(formVal, () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Catalog Updated',
        detail: this.isEditMode() 
          ? `Product '${formVal.name}' modified successfully.`
          : `New SKU '${formVal.name}' added to workspace.`
      });
      this.closeDialog();
    });
  }

  public confirmDeleteProduct(product: Product): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete SKU listing '${product.name}'? This action is irreversible.`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary p-button-sm',
      accept: () => {
        this.productStore.deleteProduct(product.id, () => {
          this.messageService.add({
            severity: 'warn',
            summary: 'SKU Deleted',
            detail: `Product listing '${product.name}' removed.`
          });
        });
      }
    });
  }

  public deleteSelectedProducts(): void {
    const count = this.selectedProducts.length;
    this.confirmationService.confirm({
      message: `Are you sure you want to bulk-delete ${count} selected product listings?`,
      header: 'Bulk Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary p-button-sm',
      accept: () => {
        // Sequentially delete
        this.selectedProducts.forEach(p => {
          this.productStore.deleteProduct(p.id);
        });
        
        this.messageService.add({
          severity: 'warn',
          summary: 'Bulk Action Complete',
          detail: `Bulk deleted ${count} products.`
        });
        this.selectedProducts = [];
      }
    });
  }

  public onProductImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const formData = new FormData();
      formData.append('file', file);

      this.uploadingImage.set(true);
      this.http.post<{ url: string }>('/api/upload', formData).subscribe({
        next: (res) => {
          this.productForm.patchValue({ imageUrl: res.url });
          this.uploadingImage.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Image Uploaded',
            detail: 'Product image updated successfully.'
          });
        },
        error: (err) => {
          this.uploadingImage.set(false);
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
