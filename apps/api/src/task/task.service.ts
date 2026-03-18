import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Task } from '@libs/data/src/entities/task';

export interface RequestUser {
  userId: string;
  username: string;
  roles: string[];
  orgId: string;
}

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>
  ) {}

  /**
   * Creates a new task, associating it with the requesting user and organization.
   * @param dto - Partial task data to create a new task.
   * @param user - The requesting user.
   * @returns The created task.
   */
  create(dto: DeepPartial<Task>, user?: RequestUser): Promise<Task> {
    const taskData: DeepPartial<Task> = { ...dto };
    if (user?.userId) {
      taskData.createdBy = { id: parseInt(user.userId) };
    }
    if (user?.orgId && !taskData.organization) {
      taskData.organization = { id: parseInt(user.orgId) };
    }
    const task = this.taskRepository.create(taskData);
    return this.taskRepository.save(task);
  }

  /**
   * Retrieves tasks scoped by the requesting user's role and organization.
   * - Owner: sees all tasks
   * - Admin/Viewer: sees only tasks within their organization
   * @param user - The requesting user.
   * @returns An array of tasks.
   */
  findAll(user?: RequestUser): Promise<Task[]> {
    // Owners can see all tasks across all organizations
    if (user?.roles?.includes('owner')) {
      return this.taskRepository.find({ relations: ['createdBy', 'organization'] });
    }

    // Admins and Viewers see only tasks in their organization
    if (user?.orgId) {
      return this.taskRepository.find({
        where: { organization: { id: parseInt(user.orgId) } },
        relations: ['createdBy', 'organization'],
      });
    }

    return this.taskRepository.find({ relations: ['createdBy', 'organization'] });
  }

  /**
   * Finds a task by its ID with relations.
   * @param id - The ID of the task to find.
   * @returns The found task or null if not found.
   */
  findOne(id: number, user?: RequestUser): Promise<Task | null> {
    // Owners can see the task across all organizations
    if (user?.roles?.includes('owner')) {
      return this.taskRepository.findOne({ where: { id }, relations: ['createdBy', 'organization'] });
    }

    // Admins and Viewers see only the task in their organization
    if (user?.orgId) {
      return this.taskRepository.findOne({
        where: { id, organization: { id: parseInt(user.orgId) } },
        relations: ['createdBy', 'organization'],
      });
    }

    return this.taskRepository.findOne({ where: { id }, relations: ['createdBy', 'organization'] });
  }

  /**
   * Updates a task by its ID. Admins and Owners can update any task;
   * Viewers can only update tasks they created.
   * @param id - The ID of the task to update.
   * @param dto - Partial task data to update the task.
   * @param user - The requesting user.
   * @returns The updated task.
   */
  async update(id: number, dto: DeepPartial<Task>, user?: RequestUser): Promise<Task|null> {
    const task = await this.findOne(id, user);
    if (task && user) {
      const isOwnerOrAdmin = user.roles?.includes('owner') || user.roles?.includes('admin');
      const isCreator = task.createdBy?.id?.toString() === user.userId;
      if (!isOwnerOrAdmin && !isCreator) {
        throw new ForbiddenException('You do not have permission to update this task');
      }
    }
    const updateData: DeepPartial<Task> = { ...dto };
    if (user?.userId) {
      updateData.updatedBy = { id: parseInt(user.userId) };
    }
    await this.taskRepository.update(id, updateData);
    return this.findOne(id, user);
  }

  /**
   * Deletes a task by its ID. Only Owners, Admins, or the task creator can delete.
   * @param id - The ID of the task to delete.
   * @param user - The requesting user.
   */
  async remove(id: number, user?: RequestUser): Promise<void> {
    if (user) {
      const task = await this.findOne(id, user);
      if (task) {
        const isOwnerOrAdmin = user.roles?.includes('owner') || user.roles?.includes('admin');
        const isCreator = task.createdBy?.id?.toString() === user.userId;
        if (!isOwnerOrAdmin && !isCreator) {
          throw new ForbiddenException('You do not have permission to delete this task');
        }
      }
    }
    await this.taskRepository.delete(id);
  }
}
