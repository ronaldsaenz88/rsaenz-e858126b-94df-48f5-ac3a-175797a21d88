import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLog } from '@libs/data/src/entities/audit-log';

describe('AuditService', () => {
  let service: AuditService;

  const mockLog: Partial<AuditLog> = {
    id: 1,
    userId: '1',
    userEmail: 'admin@test.com',
    action: 'CREATE_TASK',
    resource: 'task',
    resourceId: '1',
    orgId: '1',
  };

  const mockRepo = {
    create: jest.fn().mockImplementation(dto => ({ ...dto })),
    save: jest.fn().mockResolvedValue(mockLog),
    find: jest.fn().mockResolvedValue([mockLog]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create and save an audit log entry', async () => {
      await service.log({ userId: '1', userEmail: 'admin@test.com', action: 'CREATE_TASK', resource: 'task', resourceId: '1', orgId: '1' });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: '1', action: 'CREATE_TASK' })
      );
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should serialize details to JSON string', async () => {
      await service.log({ userId: '2', action: 'VIEW_TASKS', details: { count: 5 } });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ details: JSON.stringify({ count: 5 }) })
      );
    });
  });

  describe('findAll', () => {
    it('should return all audit log entries ordered by date', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockLog]);
      expect(mockRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });
  });
});
