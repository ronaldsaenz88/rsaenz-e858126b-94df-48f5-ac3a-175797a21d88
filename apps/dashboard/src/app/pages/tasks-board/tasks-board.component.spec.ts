import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TasksBoardComponent } from './tasks-board.component';
import { TasksService } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Task } from '../../models/task.model';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const mockTasks: Task[] = [
  { id: 1, title: 'Task A', category: 'Work', taskStatus: 'todo' },
  { id: 2, title: 'Task B', category: 'UI', taskStatus: 'inprogress' },
  { id: 3, title: 'Task C', category: 'Work', taskStatus: 'done' },
];

describe('TasksBoardComponent', () => {
  let component: TasksBoardComponent;
  let fixture: ComponentFixture<TasksBoardComponent>;
  let tasksService: jest.Mocked<TasksService>;
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;

  const mockTasksService: Partial<jest.Mocked<TasksService>> = {
    getTasks: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  };

  const mockAuthService: Partial<jest.Mocked<AuthService>> = {
    hasPermission: jest.fn(),
  };

  const mockRouter = { navigate: jest.fn() };

  beforeEach(async () => {
    (mockTasksService.getTasks as jest.Mock).mockReturnValue(of([...mockTasks]));

    await TestBed.configureTestingModule({
      imports: [TasksBoardComponent, DragDropModule, CommonModule, FormsModule],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TasksBoardComponent);
    component = fixture.componentInstance;
    tasksService = TestBed.inject(TasksService) as jest.Mocked<TasksService>;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
    jest.clearAllMocks();
    (mockTasksService.getTasks as jest.Mock).mockReturnValue(of([...mockTasks]));
    (mockAuthService.hasPermission as jest.Mock).mockReturnValue(false);
    fixture.detectChanges();
  });

  it('should be defined', () => {
    expect(component).toBeDefined();
  });

  // ─── permission getters ──────────────────────────────────────────────────

  describe('permission getters', () => {
    it('canCreate returns true when user has task:create', () => {
      (mockAuthService.hasPermission as jest.Mock).mockImplementation(p => p === 'task:create');
      expect(component.canCreate).toBe(true);
    });

    it('canCreate returns false when user does not have task:create', () => {
      (mockAuthService.hasPermission as jest.Mock).mockReturnValue(false);
      expect(component.canCreate).toBe(false);
    });

    it('canEdit returns true when user has task:update', () => {
      (mockAuthService.hasPermission as jest.Mock).mockImplementation(p => p === 'task:update');
      expect(component.canEdit).toBe(true);
    });

    it('canDelete returns true when user has task:delete', () => {
      (mockAuthService.hasPermission as jest.Mock).mockImplementation(p => p === 'task:delete');
      expect(component.canDelete).toBe(true);
    });

    it('canDrag returns true when user has task:update', () => {
      (mockAuthService.hasPermission as jest.Mock).mockImplementation(p => p === 'task:update');
      expect(component.canDrag).toBe(true);
    });
  });

  // ─── ngOnInit / state ────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should load tasks on init', () => {
      expect(tasksService.getTasks).toHaveBeenCalled();
      expect(component.tasks.length).toBe(3);
    });

    it('should populate columnTasks for each status', () => {
      expect(component.columnTasks['todo'].length).toBe(1);
      expect(component.columnTasks['inprogress'].length).toBe(1);
      expect(component.columnTasks['done'].length).toBe(1);
    });
  });

  // ─── filtering ───────────────────────────────────────────────────────────

  describe('filteredTasks', () => {
    it('should return all tasks when no filters are applied', () => {
      expect(component.filteredTasks.length).toBe(3);
    });

    it('should filter tasks by category', () => {
      component.filterCategory = 'Work';
      expect(component.filteredTasks.every(t => t.category === 'Work')).toBe(true);
      expect(component.filteredTasks.length).toBe(2);
    });

    it('should filter tasks by status', () => {
      component.filterStatus = 'todo';
      expect(component.filteredTasks.every(t => t.taskStatus === 'todo')).toBe(true);
      expect(component.filteredTasks.length).toBe(1);
    });

    it('should filter tasks by title text (case-insensitive)', () => {
      component.filterText = 'task a';
      expect(component.filteredTasks.length).toBe(1);
      expect(component.filteredTasks[0].title).toBe('Task A');
    });
  });

  // ─── sorting ─────────────────────────────────────────────────────────────

  describe('setSort', () => {
    it('should set the sort column and default to ascending', () => {
      component.setSort('title');
      expect(component.sortColumn).toBe('title');
      expect(component.sortAsc).toBe(true);
    });

    it('should toggle sort direction when the same column is clicked twice', () => {
      component.setSort('title');
      component.setSort('title');
      expect(component.sortAsc).toBe(false);
    });

    it('should reset to ascending when a different column is selected', () => {
      component.setSort('title');
      component.sortAsc = false;
      component.setSort('category');
      expect(component.sortAsc).toBe(true);
    });
  });

  // ─── navigation ──────────────────────────────────────────────────────────

  describe('navigation', () => {
    it('listTasks() navigates to /tasks/list', () => {
      component.listTasks();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks', 'list']);
    });

    it('addTask() navigates to /tasks/add', () => {
      component.addTask();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks', 'add']);
    });

    it('editTask() navigates to /tasks/edit/:id', () => {
      component.editTask(mockTasks[0]);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks', 'edit', 1]);
    });
  });

  // ─── deleteTask ──────────────────────────────────────────────────────────

  describe('deleteTask', () => {
    it('should remove the task from the list after successful delete', () => {
      (mockTasksService.deleteTask as jest.Mock).mockReturnValue(of(undefined));
      component.deleteTask(mockTasks[0]);
      expect(tasksService.deleteTask).toHaveBeenCalledWith(1);
      expect(component.tasks.find(t => t.id === 1)).toBeUndefined();
    });

    it('should not call deleteTask when the task has no id', () => {
      const taskWithoutId: Task = { title: 'No ID', category: 'Work', taskStatus: 'todo' };
      component.deleteTask(taskWithoutId);
      expect(tasksService.deleteTask).not.toHaveBeenCalled();
    });
  });
});
