import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '@libs/auth/src/lib/roles.decorator';
import { RolesGuard } from '@libs/auth/src/lib/roles.guard';
import { Role } from '@libs/auth/src/lib/roles.enum';
import { Task } from '@libs/data/src/entities/task';
import { TaskService } from './task.service';
import { AuditService } from '../audit/audit.service';
import { DeepPartial } from 'typeorm';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
/**
 * TaskController handles CRUD operations for tasks.
 * It uses JWT authentication and role-based access control.
 */
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Roles(Role.Owner, Role.Admin)
  /**
   * Creates a new task. Restricted to Owner and Admin roles.
   * @param dto - Partial task data to create a new task.
   * @param req - The HTTP request containing the authenticated user.
   * @returns The created task.
   */
  async create(@Body() dto: DeepPartial<Task>, @Request() req) {
    const task = await this.taskService.create(dto, req.user);
    await this.auditService.log({
      userId: req.user.userId,
      userEmail: req.user.username,
      action: 'CREATE_TASK',
      resource: 'task',
      resourceId: task.id?.toString(),
      orgId: req.user.orgId,
      details: { title: task.title },
    });
    return task;
  }

  @Get()
  /**
   * Retrieves tasks scoped to the user's role and organization.
   * Owners see all tasks; Admins and Viewers see tasks within their org.
   * @param req - The HTTP request containing the authenticated user.
   * @returns An array of tasks.
   */
  async findAll(@Request() req) {
    const tasks = await this.taskService.findAll(req.user);
    await this.auditService.log({
      userId: req.user.userId,
      userEmail: req.user.username,
      action: 'VIEW_TASKS',
      resource: 'task',
      orgId: req.user.orgId,
    });
    return tasks;
  }

  @Get(':id')
  /**
   * Retrieves a task by its ID.
   * @param id - The ID of the task to retrieve.
   * @returns The found task or null if not found.
   */
  async findOne(@Param('id') id: number, @Request() req) {
    return this.taskService.findOne(+id, req.user);
  }

  @Put(':id')
  /**
   * Updates a task by its ID.
   * Owners and Admins can update any task; Viewers can only update tasks they created.
   * @param id - The ID of the task to update.
   * @param dto - Partial task data to update the task.
   * @param req - The HTTP request containing the authenticated user.
   * @returns The updated task.
   */
  async update(@Param('id') id: number, @Body() dto: DeepPartial<Task>, @Request() req) {
    const task = await this.taskService.update(+id, dto, req.user);
    await this.auditService.log({
      userId: req.user.userId,
      userEmail: req.user.username,
      action: 'UPDATE_TASK',
      resource: 'task',
      resourceId: id?.toString(),
      orgId: req.user.orgId,
      details: { updatedFields: Object.keys(dto) },
    });
    return task;
  }

  @Delete(':id')
  /**
   * Deletes a task by its ID.
   * Owners and Admins can delete any task; Viewers can only delete tasks they created.
   * @param id - The ID of the task to delete.
   * @param req - The HTTP request containing the authenticated user.
   * @returns An object indicating the deletion status.
   */
  async remove(@Param('id') id: number, @Request() req) {
    await this.taskService.remove(+id, req.user);
    await this.auditService.log({
      userId: req.user.userId,
      userEmail: req.user.username,
      action: 'DELETE_TASK',
      resource: 'task',
      resourceId: id?.toString(),
      orgId: req.user.orgId,
    });
    return { deleted: true };
  }
}
