import { Injectable, signal, computed, inject } from '@angular/core';
import { Category } from '../core/models/app.models';
import { CategoryService } from '../core/services/category.service';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CategoryStore {
  private categoryService = inject(CategoryService);

  // Core state signals
  private _categories = signal<Category[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Filter signals
  public readonly searchQuery = signal<string>('');

  // Read-only public signals
  public readonly categories = computed(() => this._categories());
  public readonly loading = computed(() => this._loading());
  public readonly error = computed(() => this._error());

  // Filtered categories
  public readonly filteredCategories = computed(() => {
    let list = this._categories();
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.description.toLowerCase().includes(query)
      );
    }
    return list;
  });

  public loadCategories(): void {
    this._loading.set(true);
    this.categoryService.getCategories()
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (cats) => this._categories.set(cats),
        error: (err) => this._error.set(err.message || 'Failed to load categories')
      });
  }

  public saveCategory(category: Category, onSuccess?: () => void): void {
    this._loading.set(true);
    this.categoryService.saveCategory(category)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: () => {
          this.loadCategories();
          if (onSuccess) onSuccess();
        },
        error: (err) => this._error.set(err.message || 'Failed to save category')
      });
  }

  public deleteCategory(id: number, onSuccess?: () => void): void {
    this._loading.set(true);
    this.categoryService.deleteCategory(id)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: () => {
          this.loadCategories();
          if (onSuccess) onSuccess();
        },
        error: (err) => this._error.set(err.message || 'Failed to delete category')
      });
  }
}
