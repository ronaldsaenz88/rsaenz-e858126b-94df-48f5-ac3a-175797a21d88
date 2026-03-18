import { Injectable, inject } from '@angular/core';
import { baseUrl } from '../app.config';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface JwtPayload {
  username: string;
  sub: string;
  roles: string[];
  permissions: string[];
  orgId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiLoginUrl = `${baseUrl}/api/auth/login`;

  // Constructor using inject (Angular 16+)
  private http = inject(HttpClient);

  // Login method to authenticate user and store JWT token
  login(email: string, password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(this.apiLoginUrl, { email, password }).pipe(
      tap(res => {
        // Store the JWT token for future requests
        localStorage.setItem('jwt', res.access_token);
      })
    );
  }

  // Logout method to clear the stored JWT token
  logout() {
    localStorage.removeItem('jwt');
  }

  // Method to check if user is authenticated
  getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  // Decode JWT payload without external libraries
  getDecodedToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      // Convert base64url to standard base64 then restore any missing padding
      let base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      base64 += '='.repeat((4 - (base64.length % 4)) % 4);
      const jsonPayload = atob(base64);
      return JSON.parse(jsonPayload) as JwtPayload;
    } catch {
      return null;
    }
  }

  // Get roles from the decoded JWT
  getUserRoles(): string[] {
    return this.getDecodedToken()?.roles ?? [];
  }

  // Check if the current user has a specific permission.
  // Permissions are read directly from the JWT (populated by the backend from the DB),
  // so no client-side role→permission mapping is needed.
  hasPermission(permission: string): boolean {
    return this.getDecodedToken()?.permissions?.includes(permission) ?? false;
  }
}