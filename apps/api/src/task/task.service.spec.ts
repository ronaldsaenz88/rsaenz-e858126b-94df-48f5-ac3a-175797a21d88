import { Test, TestingModule } from '@nestjs/testing';
import { TaskService, RequestUser } from './task.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from '@libs/data/src/entities/task';
import { DeepPartial, Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';

describe('TaskService', () => {
  let service: TaskService;
  let repo: Repository<Task>;

  const mockTask = { id: 1, title: 'Test Task', createdBy: { id: 1 }, organization: { id: 1 } } as Task;

  const mockRepo = {
    create: jest.fn().mockImplementation(dto => ({ ...dto })),
    save: jest.fn().mockResolvedValue(mockTask),
    find: jest.fn().mockResolvedValue([mockTask]),
    findOne: jest.fn().mockImplementation(({ where }) =>
      where.id === 1 ? mockTask : null
    ),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  };

  const ownerUser: RequestUser = { userId: '99', username: 'owner@test.com', roles: ['owner'], orgId: '1' };
  const adminUser: RequestUser = { userId: '2', username: 'admin@test.com', roles: ['admin'], orgId: '1' };
  const viewerUser: RequestUser = { userId: '1', username: 'viewer@test.com', roles: ['viewer'], orgId: '1' };
  const otherUser: RequestUser = { userId: '5', username: 'other@test.com', roles: ['viewer'], orgId: '2' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: getRepositoryToken(Task), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    repo = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a task', async () => {
      const dto = { title: 'New Task' };
      await expect(service.create(dto)).resolves.toEqual(mockTask);
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });

    it('should associate task with the requesting user and org', async () => {
      const dto = { title: 'New Task' };
      await service.create(dto, adminUser);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: { id: 2 }, organization: { id: 1 } })
      );
    });
  });

  describe('findAll', () => {
    it('should return all tasks for owner role', async () => {
      await expect(service.findAll(ownerUser)).resolves.toEqual([mockTask]);
      expect(repo.find).toHaveBeenCalledWith({ relations: ['createdBy', 'organization'] });
    });

    it('should return org-scoped tasks for admin role', async () => {
      await expect(service.findAll(adminUser)).resolves.toEqual([mockTask]);
      expect(repo.find).toHaveBeenCalledWith({
        where: { organization: { id: 1 } },
        relations: ['createdBy', 'organization'],
      });
    });

    it('should return org-scoped tasks for viewer role', async () => {
      await expect(service.findAll(viewerUser)).resolves.toEqual([mockTask]);
      expect(repo.find).toHaveBeenCalledWith({
        where: { organization: { id: 1 } },
        relations: ['createdBy', 'organization'],
      });
    });

    it('should return all tasks with relations when no user provided', async () => {
      await expect(service.findAll()).resolves.toEqual([mockTask]);
      expect(repo.find).toHaveBeenCalledWith({ relations: ['createdBy', 'organization'] });
    });
  });

  describe('findOne', () => {
    it('should return a task by id with relations', async () => {
      const result = await service.findOne(1);
      expect(result).toEqual(mockTask);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['createdBy', 'organization'] });
    });

    it('should return null if task not found', async () => {
      const result = await service.findOne(2);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should allow owner to update any task', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTask);
      await expect(service.update(1, { title: 'Updated' }, ownerUser)).resolves.toEqual(mockTask);
      expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Updated' }));
    });

    it('should allow admin to update any task', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTask);
      await expect(service.update(1, { title: 'Updated' }, adminUser)).resolves.toEqual(mockTask);
    });

    it('should allow creator (viewer) to update their own task', async () => {
      const taskOwnedByViewer = { ...mockTask, createdBy: { id: 1 } } as Task;
      jest.spyOn(service, 'findOne').mockResolvedValue(taskOwnedByViewer);
      await expect(service.update(1, { title: 'Updated' }, viewerUser)).resolves.toEqual(taskOwnedByViewer);
    });

    it('should throw ForbiddenException if viewer tries to update someone else\'s task', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTask); // createdBy.id = 1, viewer.userId = '5'
      await expect(service.update(1, { title: 'Hack' }, otherUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should allow owner to delete any task', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTask);
      await expect(service.remove(1, ownerUser)).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('should allow creator to delete their own task', async () => {
      const taskOwnedByViewer = { ...mockTask, createdBy: { id: 1 } } as Task;
      jest.spyOn(service, 'findOne').mockResolvedValue(taskOwnedByViewer);
      await expect(service.remove(1, viewerUser)).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException if viewer tries to delete someone else\'s task', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTask); // createdBy.id = 1
      await expect(service.remove(1, otherUser)).rejects.toThrow(ForbiddenException);
    });

    it('should delete a task by id without user context', async () => {
      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});