import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '@libs/auth/src/lib/roles.guard';
import { Task } from '@libs/data/src/entities/task';
import { DeepPartial } from 'typeorm';

// Dummy guard implementations for tests
class MockJwtAuthGuard {
  canActivate() { return true; }
}
class MockRolesGuard {
  canActivate() { return true; }
}

const mockUser = { userId: '1', username: 'admin@test.com', roles: ['admin'], orgId: '1' };
const mockReq = { user: mockUser };

describe('TaskController', () => {
  let controller: TaskController;
  let service: TaskService;

  const mockTaskService = {
    create: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
    findAll: jest.fn().mockResolvedValue([{ id: 1, title: 'Test Task' }]),
    findOne: jest.fn().mockImplementation((id, _user) => (id === 1 ? { id, title: 'Test Task' } : null)),
    update: jest.fn().mockImplementation((id, dto) => ({ id, ...dto })),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockRolesGuard)
      .compile();

    controller = module.get<TaskController>(TaskController);
    service = module.get<TaskService>(TaskService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task and log the audit', async () => {
      const dto: DeepPartial<Task> = { title: 'New Task' };
      const result = await controller.create(dto, mockReq);
      expect(result).toEqual({ id: 1, title: 'New Task' });
      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE_TASK', userId: '1' })
      );
    });
  });

  describe('findAll', () => {
    it('should return scoped tasks and log the audit', async () => {
      const result = await controller.findAll(mockReq);
      expect(result).toEqual([{ id: 1, title: 'Test Task' }]);
      expect(service.findAll).toHaveBeenCalledWith(mockUser);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'VIEW_TASKS', userId: '1' })
      );
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      expect(await controller.findOne(1, mockReq)).toEqual({ id: 1, title: 'Test Task' });
      expect(service.findOne).toHaveBeenCalledWith(1, mockUser);
    });
    it('should return null if task not found', async () => {
      expect(await controller.findOne(2, mockReq)).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith(2, mockUser);
    });
  });

  describe('update', () => {
    it('should update a task and log the audit', async () => {
      const dto: DeepPartial<Task> = { title: 'Updated Task' };
      const result = await controller.update(1, dto, mockReq);
      expect(result).toEqual({ id: 1, title: 'Updated Task' });
      expect(service.update).toHaveBeenCalledWith(1, dto, mockUser);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE_TASK', userId: '1' })
      );
    });
  });

  describe('remove', () => {
    it('should delete a task and log the audit', async () => {
      const result = await controller.remove(1, mockReq);
      expect(result).toEqual({ deleted: true });
      expect(service.remove).toHaveBeenCalledWith(1, mockUser);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE_TASK', userId: '1' })
      );
    });
  });
});