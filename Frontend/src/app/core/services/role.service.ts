import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role } from '../models/app.models';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  constructor(private http: HttpClient) {}

  public getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>('/api/roles');
  }

  public saveRole(role: Role): Observable<Role> {
    if (role.id) {
      return this.http.put<Role>('/api/roles', role);
    } else {
      return this.http.post<Role>('/api/roles', role);
    }
  }
}
