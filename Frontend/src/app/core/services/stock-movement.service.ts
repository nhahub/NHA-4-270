import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockMovement } from '../models/app.models';

@Injectable({
  providedIn: 'root'
})
export class StockMovementService {
  constructor(private http: HttpClient) {}

  public getStockMovements(): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>('/api/stock-movements');
  }

  public createStockMovement(movement: StockMovement): Observable<StockMovement> {
    return this.http.post<StockMovement>('/api/stock-movements', movement);
  }
}
