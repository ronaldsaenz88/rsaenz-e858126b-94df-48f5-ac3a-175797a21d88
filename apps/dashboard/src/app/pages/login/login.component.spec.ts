import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;

  const mockAuthService = {
    login: jest.fn(),
  } as unknown as jest.Mocked<AuthService>;

  const mockRouter = { navigate: jest.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, CommonModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
    jest.clearAllMocks();
    fixture.detectChanges();
  });

  it('should be defined', () => {
    expect(component).toBeDefined();
  });

  it('should render the login form', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).not.toBeNull();
    expect(compiled.querySelector('input[type="email"]')).not.toBeNull();
    expect(compiled.querySelector('input[type="password"]')).not.toBeNull();
  });

  // ─── form validation ──────────────────────────────────────────────────────

  describe('form validation', () => {
    it('form should be invalid when empty', () => {
      expect(component.loginForm.invalid).toBe(true);
    });

    it('form should be invalid with an invalid email', () => {
      component.loginForm.setValue({ email: 'not-an-email', password: 'secret' });
      expect(component.loginForm.invalid).toBe(true);
    });

    it('form should be invalid when password is missing', () => {
      component.loginForm.setValue({ email: 'user@test.com', password: '' });
      expect(component.loginForm.invalid).toBe(true);
    });

    it('form should be valid with valid email and password', () => {
      component.loginForm.setValue({ email: 'user@test.com', password: 'password' });
      expect(component.loginForm.valid).toBe(true);
    });
  });

  // ─── login() logic ────────────────────────────────────────────────────────

  describe('login()', () => {
    it('should set errorMsg and not call authService when form is invalid', () => {
      component.loginForm.setValue({ email: '', password: '' });
      component.login();
      expect(component.errorMsg).toBe('Email and password are required');
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it('should call authService.login with email and password from the form', () => {
      mockAuthService.login.mockReturnValue(of({ access_token: 'jwt' }));
      component.loginForm.setValue({ email: 'user@test.com', password: 'secret' });
      component.login();
      expect(mockAuthService.login).toHaveBeenCalledWith('user@test.com', 'secret');
    });

    it('should navigate to /tasks after a successful login', () => {
      mockAuthService.login.mockReturnValue(of({ access_token: 'jwt' }));
      component.loginForm.setValue({ email: 'user@test.com', password: 'secret' });
      component.login();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks']);
    });

    it('should set errorMsg on a failed login', () => {
      mockAuthService.login.mockReturnValue(throwError(() => new Error('Unauthorized')));
      component.loginForm.setValue({ email: 'user@test.com', password: 'wrong' });
      component.login();
      expect(component.errorMsg).toBe('Login failed. Check your credentials.');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });
});
