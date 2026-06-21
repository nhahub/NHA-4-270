import { Injectable, signal, computed, inject } from '@angular/core';
import { Product } from '../core/models/app.models';
import { ProductService } from '../core/services/product.service';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductStore {
  private productService = inject(ProductService);

  // Core state signals
  private _products = signal<Product[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _selectedProduct = signal<Product | null>(null);

  // Search & Filter state signals
  public readonly searchQuery = signal<string>('');
  public readonly statusFilter = signal<string>('All');
  public readonly categoryFilter = signal<number | null>(null);

  // Read-only public signals
  public readonly products = computed(() => this._products());
  public readonly loading = computed(() => this._loading());
  public readonly error = computed(() => this._error());
  public readonly selectedProduct = computed(() => this._selectedProduct());

  // Filtered products list
  public readonly filteredProducts = computed(() => {
    let list = this._products();
    const search = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const cat = this.categoryFilter();

    if (search) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.sku.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search))
      );
    }

    if (status && status !== 'All') {
      list = list.filter(p => p.status === status);
    }

    if (cat !== null) {
      list = list.filter(p => p.categoryId === cat);
    }

    return list;
  });

  // KPI computations
  public readonly totalProductsCount = computed(() => this._products().length);
  public readonly totalInventoryValue = computed(() => 
    this._products().reduce((sum, p) => sum + (p.price * p.quantity), 0)
  );
  public readonly lowStockProducts = computed(() => 
    this._products().filter(p => p.quantity > 0 && p.quantity <= 10)
  );
  public readonly outOfStockProducts = computed(() => 
    this._products().filter(p => p.quantity === 0)
  );

  public loadProducts(): void {
    this._loading.set(true);
    this._error.set(null);
    this.productService.getProducts()
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (prods) => this._products.set(prods),
        error: (err) => this._error.set(err.message || 'Failed to load products')
      });
  }

  public selectProduct(product: Product | null): void {
    this._selectedProduct.set(product);
  }

  public saveProduct(product: Product, onSuccess?: () => void): void {
    this._loading.set(true);
    this.productService.saveProduct(product)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (savedProd) => {
          this.loadProducts(); // Reload from DB
          if (onSuccess) onSuccess();
        },
        error: (err) => this._error.set(err.message || 'Failed to save product')
      });
  }

  public deleteProduct(id: number, onSuccess?: () => void): void {
    this._loading.set(true);
    this.productService.deleteProduct(id)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: () => {
          this.loadProducts();
          if (onSuccess) onSuccess();
        },
        error: (err) => this._error.set(err.message || 'Failed to delete product')
      });
  }
}
