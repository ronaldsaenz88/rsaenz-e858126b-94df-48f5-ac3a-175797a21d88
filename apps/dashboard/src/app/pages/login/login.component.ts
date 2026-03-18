import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class LoginComponent {
  email = '';
  password = '';
  errorMsg = '';

  // Constructor using inject (Angular 16+)
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  login() {
    // Check if the form is valid
    if (this.loginForm.invalid) {
      this.errorMsg = 'Email and password are required';
      return;
    }

    const { email, password } = this.loginForm.value;

    this.authService.login(email ?? '', password ?? '').subscribe({
      next: () => {
        // Redirect or reload after successful login
        this.router.navigate(['/tasks']);
      },
      error: () => {
        this.errorMsg = 'Login failed. Check your credentials.';
      }
    });
  }
}