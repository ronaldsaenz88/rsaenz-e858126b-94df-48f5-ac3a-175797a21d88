import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { baseUrl } from '../app.config';
import { TaskStore } from './task.store';
import { TasksService } from '../services/tasks.service';
import { Task } from '../models/task.model';

describe('TaskStore', () => {
  let store: TaskStore;
  let httpMock: HttpTestingController;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    category: 'Work',
    taskStatus: 'todo',
  };

  const mockTasks: Task[] = [
    mockTask,
    { id: 2, title: 'Second Task', category: 'Personal', taskStatus: 'inprogress' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskStore, TasksService],
    });
    store = TestBed.inject(TaskStore);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.setItem('jwt', 'test-token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('jwt');
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should start with an empty tasks signal', () => {
    expect(store.tasks()).toEqual([]);
  });

  it('should start with loading=false and error=null', () => {
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  describe('loadTasks()', () => {
    it('should set loading=true while fetching', fakeAsync(() => {
      store.loadTasks();
      expect(store.loading()).toBe(true);

      const req = httpMock.expectOne(`${baseUrl}/api/tasks/`);
      req.flush(mockTasks);
      tick();

      expect(store.loading()).toBe(false);
    }));

    it('should populate the tasks signal on success', fakeAsync(() => {
      store.loadTasks();
      const req = httpMock.expectOne(`${baseUrl}/api/tasks/`);
      req.flush(mockTasks);
      tick();

      expect(store.tasks()).toEqual(mockTasks);
    }));

    it('should set error signal on failure', fakeAsync(() => {
      store.loadTasks();
      const req = httpMock.expectOne(`${baseUrl}/api/tasks/`);
      req.flush('error', { status: 500, statusText: 'Server Error' });
      tick();

      expect(store.error()).toBe('Failed to load tasks');
      expect(store.loading()).toBe(false);
      expect(store.tasks()).toEqual([]);
    }));
  });

  describe('getTask()', () => {
    it('should return a cached task without making an HTTP call', fakeAsync(() => {
      // Seed the store
      store.loadTasks();
      httpMock.expectOne(`${baseUrl}/api/tasks/`).flush(mockTasks);
      tick();

      let result: Task | undefined;
      store.getTask(1).subscribe(t => (result = t));

      httpMock.expectNone(`${baseUrl}/api/tasks/1`);
      expect(result).toEqual(mockTask);
    }));

    it('should fetch from the API when the task is not in the store', fakeAsync(() => {
      let result: Task | undefined;
      store.getTask(99).subscribe(t => (result = t));

      const req = httpMock.expectOne(`${baseUrl}/api/tasks/99`);
      req.flush({ id: 99, title: 'Remote Task', category: 'Work', taskStatus: 'todo' });
      tick();

      expect(result?.id).toBe(99);
    }));

    it('should cache the task in the store after fetching from API', fakeAsync(() => {
      const remoteTask: Task = { id: 99, title: 'Remote Task', category: 'Work', taskStatus: 'todo' };

      store.getTask(99).subscribe();
      httpMock.expectOne(`${baseUrl}/api/tasks/99`).flush(remoteTask);
      tick();

      // Second call should use the cache — no additional HTTP request
      let result: Task | undefined;
      store.getTask(99).subscribe(t => (result = t));
      httpMock.expectNone(`${baseUrl}/api/tasks/99`);
      expect(result).toEqual(remoteTask);
    }));
  });

  describe('addTask()', () => {
    it('should append the created task to the store signal', fakeAsync(() => {
      const newTask: Task = { title: 'New', category: 'Work', taskStatus: 'todo' };
      const created: Task = { id: 3, ...newTask };

      store.addTask(newTask).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/api/tasks/`);
      expect(req.request.method).toBe('POST');
      req.flush(created);
      tick();

      expect(store.tasks()).toContain(created);
    }));
  });

  describe('updateTask()', () => {
    it('should patch the updated task in the store signal', fakeAsync(() => {
      // Pre-populate store
      store.loadTasks();
      httpMock.expectOne(`${baseUrl}/api/tasks/`).flush(mockTasks);
      tick();

      const updated: Task = { ...mockTask, taskStatus: 'done' };
      store.updateTask(1, { taskStatus: 'done' }).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/api/tasks/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(updated);
      tick();

      const stored = store.tasks().find(t => t.id === 1);
      expect(stored?.taskStatus).toBe('done');
    }));
  });

  describe('deleteTask()', () => {
    it('should remove the deleted task from the store signal', fakeAsync(() => {
      // Pre-populate store
      store.loadTasks();
      httpMock.expectOne(`${baseUrl}/api/tasks/`).flush(mockTasks);
      tick();

      expect(store.tasks().length).toBe(2);

      store.deleteTask(1).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/api/tasks/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      tick();

      expect(store.tasks().length).toBe(1);
      expect(store.tasks().find(t => t.id === 1)).toBeUndefined();
    }));
  });
});
