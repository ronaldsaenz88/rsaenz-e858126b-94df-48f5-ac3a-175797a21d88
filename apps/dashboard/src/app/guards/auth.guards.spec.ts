import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guards';
import { TaskWriteGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: Router;

  const mockRouter = { navigate: jest.fn() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: Router, useValue: mockRouter },
      ],
    });
    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => localStorage.clear());

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when a JWT token is stored', () => {
    localStorage.setItem('jwt', 'some-token');
    expect(guard.canActivate()).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to /login when no token is stored', () => {
    expect(guard.canActivate()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});

describe('TaskWriteGuard', () => {
  let guard: TaskWriteGuard;
  let authService: jest.Mocked<AuthService>;

  const mockRouter = { navigate: jest.fn() };

  beforeEach(() => {
    const mockAuthService = { hasPermission: jest.fn() } as unknown as jest.Mocked<AuthService>;

    TestBed.configureTestingModule({
      providers: [
        TaskWriteGuard,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
    guard = TestBed.inject(TaskWriteGuard);
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when the user has task:create permission', () => {
    authService.hasPermission.mockImplementation(p => p === 'task:create');
    expect(guard.canActivate()).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should allow access when the user has task:update permission', () => {
    authService.hasPermission.mockImplementation(p => p === 'task:update');
    expect(guard.canActivate()).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should allow access when the user has both task:create and task:update', () => {
    authService.hasPermission.mockReturnValue(true);
    expect(guard.canActivate()).toBe(true);
  });

  it('should deny access and redirect to /tasks when user has only task:read', () => {
    authService.hasPermission.mockReturnValue(false);
    expect(guard.canActivate()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks']);
  });
});
