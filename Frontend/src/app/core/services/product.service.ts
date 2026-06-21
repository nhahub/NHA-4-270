import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/app.models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private http: HttpClient) {}

  public getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products');
  }

  public saveProduct(product: Product): Observable<Product> {
    if (product.id) {
      return this.http.put<Product>('/api/products', product);
    } else {
      return this.http.post<Product>('/api/products', product);
    }
  }

  public deleteProduct(id: number): Observable<any> {
    return this.http.delete<any>(`/api/products/${id}`);
  }
}
