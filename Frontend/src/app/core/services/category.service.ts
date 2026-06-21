import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/app.models';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  public getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/categories');
  }

  public saveCategory(category: Category): Observable<Category> {
    if (category.id) {
      return this.http.put<Category>('/api/categories', category);
    } else {
      return this.http.post<Category>('/api/categories', category);
    }
  }

  public deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`/api/categories/${id}`);
  }
}
