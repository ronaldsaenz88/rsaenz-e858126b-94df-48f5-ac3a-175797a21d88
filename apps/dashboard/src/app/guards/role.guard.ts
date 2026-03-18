import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class TaskWriteGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    // Allow access if the user can create OR update tasks
    const canWrite =
      this.authService.hasPermission('task:create') ||
      this.authService.hasPermission('task:update');

    if (canWrite) {
      return true;
    }
    // Redirect viewers back to the task board
    this.router.navigate(['/tasks']);
    return false;
  }
}
