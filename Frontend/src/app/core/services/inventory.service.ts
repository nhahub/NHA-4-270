import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WarehouseStock } from '../models/app.models';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  constructor(private http: HttpClient) {}

  public getWarehouseStocks(): Observable<WarehouseStock[]> {
    return this.http.get<WarehouseStock[]>('/api/inventory/warehouses');
  }

  public saveWarehouse(warehouse: WarehouseStock): Observable<WarehouseStock> {
    return this.http.post<WarehouseStock>('/api/inventory/warehouses', warehouse);
  }

  public deleteWarehouse(id: number): Observable<any> {
    return this.http.delete<any>(`/api/inventory/warehouses/${id}`);
  }
}
