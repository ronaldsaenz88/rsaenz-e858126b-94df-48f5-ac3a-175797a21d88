import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private router = inject(Router);

  canActivate(): boolean {
    const token = localStorage.getItem('jwt');
    if (token) {
      // Optionally: validate token (expiry, etc.)
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}