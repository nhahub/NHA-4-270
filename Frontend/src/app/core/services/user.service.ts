import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/app.models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  public getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }

  public saveUser(user: User): Observable<User> {
    if (user.id) {
      return this.http.put<User>('/api/users', user);
    } else {
      return this.http.post<User>('/api/users', user);
    }
  }

  public deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`/api/users/${id}`);
  }
}
