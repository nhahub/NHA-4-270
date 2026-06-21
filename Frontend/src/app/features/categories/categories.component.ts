import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryStore } from '../../stores/category.store';
import { Category } from '../../core/models/app.models';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-categories',
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
    Textarea,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="categories-container fade-in">
      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>

      <!-- Page Header -->
      <div class="flex justify-content-between align-items-center mb-3">
        <div>
          <app-breadcrumb></app-breadcrumb>
          <h1 class="page-title">Categories Matrix</h1>
          <p class="page-subtitle">Configure SKU classifications and organization rules</p>
        </div>
        <div>
          <button pButton 
                  label="Add Category" 
                  icon="pi pi-plus" 
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
                   placeholder="Search categories..." 
                   (input)="onSearch($event)" />
          </span>
        </div>
      </div>

      <!-- Display Area -->
      @if (categoryStore.error(); as err) {
        <app-error-state [message]="err" (retry)="categoryStore.loadCategories()"></app-error-state>
      } @else if (categoryStore.loading() && categoryStore.categories().length === 0) {
        <app-skeleton-loader type="table"></app-skeleton-loader>
      } @else {
        <p-table [value]="categoryStore.filteredCategories()" 
                 [paginator]="true" 
                 [rows]="10" 
                 [rowsPerPageOptions]="[5, 10, 20]" 
                 [rowHover]="true" 
                 responsiveLayout="scroll"
                 class="w-full">
          
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 8rem" pSortableColumn="id">ID <p-sortIcon field="id"></p-sortIcon></th>
              <th pSortableColumn="name">Category Name <p-sortIcon field="name"></p-sortIcon></th>
              <th>Description</th>
              <th style="width: 8rem">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-category>
            <tr>
              <td>
                <span class="id-tag">#{{ category.id }}</span>
              </td>
              <td>
                <span class="font-bold text-primary">{{ category.name }}</span>
              </td>
              <td>
                <span class="text-secondary">{{ category.description || 'No description provided.' }}</span>
              </td>
              <td>
                <div class="flex gap-2">
                  <button pButton 
                          icon="pi pi-pencil" 
                          class="p-button-rounded p-button-text p-button-secondary" 
                          (click)="openEditDialog(category)">
                  </button>
                  <button pButton 
                          icon="pi pi-trash" 
                          class="p-button-rounded p-button-text p-button-danger" 
                          (click)="confirmDeleteCategory(category)">
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4">
                <app-empty-state 
                  title="No Categories Available" 
                  description="There are no categories in this workspace. Create one to organize your product listings."
                  icon="pi pi-tags"
                  actionLabel="Add Category"
                  (actionClicked)="openCreateDialog()">
                </app-empty-state>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }

      <!-- Add/Edit Category Dialog Modal -->
      <p-dialog [(visible)]="displayFormDialog" 
                [header]="isEditMode() ? 'Modify Category' : 'Create Category'" 
                [modal]="true" 
                styleClass="responsive-modal-dialog"
                contentStyleClass="p-fluid">
        
        <form [formGroup]="categoryForm" class="p-fluid pt-2">
          <!-- Name -->
          <div class="field mb-3">
            <label for="cat-name" class="font-semibold block mb-2">Category Name</label>
            <input id="cat-name" type="text" pInputText formControlName="name" placeholder="e.g. Electrical Tools" />
            @if (categoryForm.get('name')?.touched && categoryForm.get('name')?.invalid) {
              <small class="p-error">Category name is required.</small>
            }
          </div>

          <!-- Description -->
          <div class="field mb-4">
            <label for="cat-desc" class="font-semibold block mb-2">Description</label>
            <textarea id="cat-desc" 
                      pTextarea 
                      formControlName="description" 
                      rows="4" 
                      placeholder="Specify tags or scope of items belonging to this category..."></textarea>
          </div>

          <!-- Form Action Buttons -->
          <div class="flex justify-content-end gap-2">
            <button pButton 
                    type="button" 
                    label="Cancel" 
                    class="p-button-outlined p-button-secondary" 
                    (click)="closeDialog()">
            </button>
            <button pButton 
                    type="submit" 
                    label="Save Class" 
                    class="p-button-primary" 
                    [disabled]="categoryForm.invalid"
                    (click)="onSaveCategory()">
            </button>
          </div>
        </form>
      </p-dialog>
    </div>
  `,
  styles: [`
    .categories-container {
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

    .id-tag {
      font-family: monospace;
      background: rgba(37, 99, 235, 0.08);
      color: var(--primary-color);
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.8rem;
    }

    body.dark-theme {
      .id-tag {
        background: rgba(37, 99, 235, 0.15);
      }
    }
  `]
})
export class CategoriesComponent implements OnInit {
  public categoryStore = inject(CategoryStore);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  public displayFormDialog = false;
  public isEditMode = signal<boolean>(false);
  public categoryForm!: FormGroup;

  public ngOnInit(): void {
    this.categoryStore.loadCategories();

    this.categoryForm = this.fb.group({
      id: [null],
      name: ['', Validators.required],
      description: ['']
    });
  }

  public onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.categoryStore.searchQuery.set(input.value);
  }

  public openCreateDialog(): void {
    this.isEditMode.set(false);
    this.categoryForm.reset({
      id: null,
      name: '',
      description: ''
    });
    this.displayFormDialog = true;
  }

  public openEditDialog(category: Category): void {
    this.isEditMode.set(true);
    this.categoryForm.setValue({
      id: category.id,
      name: category.name,
      description: category.description || ''
    });
    this.displayFormDialog = true;
  }

  public closeDialog(): void {
    this.displayFormDialog = false;
  }

  public onSaveCategory(): void {
    if (this.categoryForm.invalid) return;

    const formVal = this.categoryForm.value;

    this.categoryStore.saveCategory(formVal, () => {
      this.messageService.add({
        severity: 'success',
        summary: 'Category Matrix Updated',
        detail: this.isEditMode() 
          ? `Category '${formVal.name}' modified.`
          : `New category '${formVal.name}' generated.`
      });
      this.closeDialog();
    });
  }

  public confirmDeleteCategory(category: Category): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete category '${category.name}'? This may affect products categorised under it.`,
      header: 'Delete Classification',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary p-button-sm',
      accept: () => {
        this.categoryStore.deleteCategory(category.id, () => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Category Removed',
            detail: `Category '${category.name}' deleted.`
          });
        });
      }
    });
  }
}
