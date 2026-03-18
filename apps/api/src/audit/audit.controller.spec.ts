import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '@libs/auth/src/lib/roles.guard';
import { AuditLog } from '@libs/data/src/entities/audit-log';

class MockJwtAuthGuard { canActivate() { return true; } }
class MockRolesGuard { canActivate() { return true; } }

describe('AuditController', () => {
  let controller: AuditController;

  const mockLogs: Partial<AuditLog>[] = [
    { id: 1, userId: '1', action: 'CREATE_TASK', resource: 'task', resourceId: '1' },
  ];

  const mockAuditService = {
    findAll: jest.fn().mockResolvedValue(mockLogs),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: mockAuditService }],
    })
      .overrideGuard(JwtAuthGuard).useClass(MockJwtAuthGuard)
      .overrideGuard(RolesGuard).useClass(MockRolesGuard)
      .compile();

    controller = module.get<AuditController>(AuditController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all audit log entries', async () => {
      const result = await controller.findAll({ user: { userId: '1', roles: ['admin'] } });
      expect(result).toEqual(mockLogs);
      expect(mockAuditService.findAll).toHaveBeenCalled();
    });
  });
});
