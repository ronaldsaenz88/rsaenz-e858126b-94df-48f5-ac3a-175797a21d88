import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from '../models/audit-log.model';
import { baseUrl } from '../app.config';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let httpMock: HttpTestingController;

  const mockLogs: AuditLog[] = [
    { id: 1, userId: '1', userEmail: 'admin@test.com', action: 'CREATE_TASK', resource: 'task', resourceId: '1', orgId: '1', createdAt: '2024-01-01T00:00:00Z' },
    { id: 2, userId: '1', action: 'VIEW_TASKS', createdAt: '2024-01-02T00:00:00Z' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuditLogService],
    });
    service = TestBed.inject(AuditLogService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.setItem('jwt', 'test-token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('jwt');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuditLogs', () => {
    it('should send a GET request to the audit-log endpoint', () => {
      service.getAuditLogs().subscribe();
      const req = httpMock.expectOne(`${baseUrl}/api/audit-log`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should include the Authorization header with the stored JWT', () => {
      service.getAuditLogs().subscribe();
      const req = httpMock.expectOne(`${baseUrl}/api/audit-log`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush([]);
    });

    it('should return the audit log entries from the server', () => {
      let result: AuditLog[] | undefined;
      service.getAuditLogs().subscribe(logs => (result = logs));

      const req = httpMock.expectOne(`${baseUrl}/api/audit-log`);
      req.flush(mockLogs);

      expect(result).toEqual(mockLogs);
      expect(result?.length).toBe(2);
    });
  });
});
