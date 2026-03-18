import { Component, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';


@Component({
  selector: 'app-header',
  imports: [NgIf, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  // Constructor using inject (Angular 16+)
  private authService = inject(AuthService);
  private router = inject(Router);
  themeService = inject(ThemeService);

  mobileMenuOpen = false;

  get canViewTasks(): boolean {
    return this.authService.hasPermission('task:read');
  }

  get canViewAuditLog(): boolean {
    return this.authService.hasPermission('audit:read');
  }

  logout() {
    this.mobileMenuOpen = false;
    this.authService.logout(); // just call the method
    this.router.navigate(['/login']);
  }
}