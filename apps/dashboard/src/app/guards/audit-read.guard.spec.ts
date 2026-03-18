import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuditReadGuard } from './audit-read.guard';
import { AuthService } from '../services/auth.service';

describe('AuditReadGuard', () => {
  let guard: AuditReadGuard;
  let authService: jest.Mocked<AuthService>;

  const mockRouter = { navigate: jest.fn() };

  beforeEach(() => {
    const mockAuthService = { hasPermission: jest.fn() } as unknown as jest.Mocked<AuthService>;

    TestBed.configureTestingModule({
      providers: [
        AuditReadGuard,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
    guard = TestBed.inject(AuditReadGuard);
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when the user has audit:read permission', () => {
    authService.hasPermission.mockReturnValue(true);
    expect(guard.canActivate()).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to /tasks when the user does not have audit:read', () => {
    authService.hasPermission.mockReturnValue(false);
    expect(guard.canActivate()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('should check exactly the audit:read permission', () => {
    authService.hasPermission.mockReturnValue(false);
    guard.canActivate();
    expect(authService.hasPermission).toHaveBeenCalledWith('audit:read');
  });
});
