import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { baseUrl } from '../app.config';

/** Build a compact fake JWT with the given payload. */
function fakeJwt(payload: object): string {
  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.sig`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── login ───────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should POST credentials to the login endpoint', () => {
      service.login('user@test.com', 'secret').subscribe();
      const req = httpMock.expectOne(`${baseUrl}/api/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'user@test.com', password: 'secret' });
      req.flush({ access_token: 'jwt.token' });
    });

    it('should store the JWT in localStorage after a successful login', () => {
      service.login('user@test.com', 'secret').subscribe();
      const req = httpMock.expectOne(`${baseUrl}/api/auth/login`);
      req.flush({ access_token: 'stored-token' });
      expect(localStorage.getItem('jwt')).toBe('stored-token');
    });

    it('should return the access_token in the observable', () => {
      let received: string | undefined;
      service.login('user@test.com', 'secret').subscribe(res => {
        received = res.access_token;
      });
      const req = httpMock.expectOne(`${baseUrl}/api/auth/login`);
      req.flush({ access_token: 'my-jwt' });
      expect(received).toBe('my-jwt');
    });
  });

  // ─── logout ──────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should remove the JWT from localStorage', () => {
      localStorage.setItem('jwt', 'some-token');
      service.logout();
      expect(localStorage.getItem('jwt')).toBeNull();
    });
  });

  // ─── getToken ────────────────────────────────────────────────────────────

  describe('getToken', () => {
    it('should return the stored token', () => {
      localStorage.setItem('jwt', 'my-token');
      expect(service.getToken()).toBe('my-token');
    });

    it('should return null when no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  // ─── getDecodedToken ─────────────────────────────────────────────────────

  describe('getDecodedToken', () => {
    it('should decode and return the JWT payload', () => {
      const payload = { username: 'a@b.com', sub: '1', roles: ['admin'], permissions: ['task:read'], orgId: '1' };
      localStorage.setItem('jwt', fakeJwt(payload));

      const decoded = service.getDecodedToken();
      expect(decoded?.username).toBe('a@b.com');
      expect(decoded?.roles).toEqual(['admin']);
      expect(decoded?.permissions).toEqual(['task:read']);
      expect(decoded?.orgId).toBe('1');
    });

    it('should return null when no token is stored', () => {
      expect(service.getDecodedToken()).toBeNull();
    });

    it('should return null for a malformed token', () => {
      localStorage.setItem('jwt', 'not.valid');
      expect(service.getDecodedToken()).toBeNull();
    });
  });

  // ─── getUserRoles ─────────────────────────────────────────────────────────

  describe('getUserRoles', () => {
    it('should return roles from the decoded JWT', () => {
      localStorage.setItem('jwt', fakeJwt({ roles: ['owner'], permissions: [], orgId: '1', username: 'o', sub: '1' }));
      expect(service.getUserRoles()).toEqual(['owner']);
    });

    it('should return an empty array when no token is present', () => {
      expect(service.getUserRoles()).toEqual([]);
    });
  });

  // ─── hasPermission ───────────────────────────────────────────────────────

  describe('hasPermission', () => {
    it('should return true for a permission present in the JWT', () => {
      localStorage.setItem('jwt', fakeJwt({ roles: ['admin'], permissions: ['task:create', 'task:read'], orgId: '1', username: 'a', sub: '1' }));
      expect(service.hasPermission('task:create')).toBe(true);
    });

    it('should return false for a permission not present in the JWT', () => {
      localStorage.setItem('jwt', fakeJwt({ roles: ['viewer'], permissions: ['task:read'], orgId: '1', username: 'v', sub: '2' }));
      expect(service.hasPermission('task:delete')).toBe(false);
    });

    it('should return false when no token is stored', () => {
      expect(service.hasPermission('task:read')).toBe(false);
    });

    it('owner should have all task and audit permissions', () => {
      const perms = ['task:create', 'task:read', 'task:update', 'task:delete', 'audit:read'];
      localStorage.setItem('jwt', fakeJwt({ roles: ['owner'], permissions: perms, orgId: '1', username: 'owner', sub: '3' }));
      perms.forEach(p => expect(service.hasPermission(p)).toBe(true));
    });

    it('viewer should only have task:read permission', () => {
      localStorage.setItem('jwt', fakeJwt({ roles: ['viewer'], permissions: ['task:read'], orgId: '2', username: 'viewer', sub: '4' }));
      expect(service.hasPermission('task:read')).toBe(true);
      expect(service.hasPermission('task:create')).toBe(false);
      expect(service.hasPermission('task:update')).toBe(false);
      expect(service.hasPermission('task:delete')).toBe(false);
      expect(service.hasPermission('audit:read')).toBe(false);
    });
  });
});
