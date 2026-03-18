import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuditReadGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    if (this.authService.hasPermission('audit:read')) {
      return true;
    }
    // Redirect users without audit:read permission to the task board
    this.router.navigate(['/tasks']);
    return false;
  }
}
