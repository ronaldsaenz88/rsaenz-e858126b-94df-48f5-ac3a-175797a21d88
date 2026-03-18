import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { baseUrl } from '../app.config';
import { Observable } from 'rxjs';
import { AuditLog } from '../models/audit-log.model';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private apiAuditLogUrl = `${baseUrl}/api/audit-log`;

  // Constructor using inject (Angular 16+)
  private http = inject(HttpClient);

  // Get token and headers dynamically
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Retrieve all audit log entries
  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(this.apiAuditLogUrl, { headers: this.getHeaders() });
  }
}
