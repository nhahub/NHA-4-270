import { Injectable, signal, computed, inject } from '@angular/core';
import { WarehouseStock, StockMovement } from '../core/models/app.models';
import { InventoryService } from '../core/services/inventory.service';
import { StockMovementService } from '../core/services/stock-movement.service';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventoryStore {
  private inventoryService = inject(InventoryService);
  private movementService = inject(StockMovementService);

  // States
  private _warehouses = signal<WarehouseStock[]>([]);
  private _movements = signal<StockMovement[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Filters
  public readonly movementTypeFilter = signal<string>('All');
  public readonly warehouseFilter = signal<string>('All');

  // Read-only public signals
  public readonly warehouses = computed(() => this._warehouses());
  public readonly movements = computed(() => this._movements());
  public readonly loading = computed(() => this._loading());
  public readonly error = computed(() => this._error());

  // Filtered movements
  public readonly filteredMovements = computed(() => {
    let list = this._movements();
    const type = this.movementTypeFilter();
    const warehouse = this.warehouseFilter();

    if (type && type !== 'All') {
      list = list.filter(m => m.movementType === type);
    }

    if (warehouse && warehouse !== 'All') {
      list = list.filter(m => m.fromWarehouse === warehouse || m.toWarehouse === warehouse);
    }

    // Sort descending by date
    return [...list].sort((a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime());
  });

  // KPI computations
  public readonly totalWarehouseCapacity = computed(() => 
    this._warehouses().reduce((sum, w) => sum + w.availableQty, 0)
  );
  public readonly totalWarehouseValue = computed(() => 
    this._warehouses().reduce((sum, w) => sum + w.value, 0)
  );

  public loadInventoryData(): void {
    this._loading.set(true);
    this._error.set(null);

    forkJoin({
      warehouses: this.inventoryService.getWarehouseStocks(),
      movements: this.movementService.getStockMovements()
    })
    .pipe(finalize(() => this._loading.set(false)))
    .subscribe({
      next: (res) => {
        this._warehouses.set(res.warehouses);
        this._movements.set(res.movements);
      },
      error: (err) => this._error.set(err.message || 'Failed to load inventory data')
    });
  }

  public createMovement(movement: StockMovement, onSuccess?: () => void): void {
    this._loading.set(true);
    this.movementService.createStockMovement(movement)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: () => {
          this.loadInventoryData(); // Reload all stock states
          if (onSuccess) onSuccess();
        },
        error: (err) => this._error.set(err.message || 'Failed to record movement')
      });
  }

  public saveWarehouse(warehouse: WarehouseStock, onSuccess?: () => void): void {
    this._loading.set(true);
    this.inventoryService.saveWarehouse(warehouse)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: () => {
          this.loadInventoryData();
          if (onSuccess) onSuccess();
        },
        error: (err) => this._error.set(err.message || 'Failed to save warehouse')
      });
  }

  public deleteWarehouse(id: number, onSuccess?: () => void): void {
    this._loading.set(true);
    this.inventoryService.deleteWarehouse(id)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: () => {
          this.loadInventoryData();
          if (onSuccess) onSuccess();
        },
        error: (err) => this._error.set(err.message || 'Failed to delete warehouse')
      });
  }
}
