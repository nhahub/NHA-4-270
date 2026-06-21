import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from '../models/app.models';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  constructor(private http: HttpClient) {}

  public getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>('/api/settings');
  }

  public saveSettings(settings: AppSettings): Observable<AppSettings> {
    return this.http.post<AppSettings>('/api/settings', settings);
  }
}
