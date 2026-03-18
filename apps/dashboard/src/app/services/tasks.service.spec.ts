import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { baseUrl } from '../app.config';
import { TasksService } from './tasks.service';
import { Task } from '../models/task.model';

describe('TasksService', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    category: 'Work',
    taskStatus: 'todo',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TasksService],
    });
    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
    // Provide a fake JWT so headers can be built
    localStorage.setItem('jwt', 'test-token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('jwt');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateTask', () => {
    it('should send PUT with only the provided fields (partial update)', () => {
      service.updateTask(1, { taskStatus: 'inprogress' }).subscribe(task => {
        expect(task.taskStatus).toBe('inprogress');
      });

      const req = httpMock.expectOne(`${baseUrl}/api/tasks/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ taskStatus: 'inprogress' });
      req.flush({ ...mockTask, taskStatus: 'inprogress' });
    });

    it('should send PUT with the full task object when all fields are provided', () => {
      service.updateTask(1, mockTask).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/api/tasks/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockTask);
      req.flush(mockTask);
    });

    it('should return the updated task from the server', () => {
      const serverResponse: Task = { ...mockTask, taskStatus: 'done' };
      let result: Task | undefined;

      service.updateTask(1, { taskStatus: 'done' }).subscribe(task => {
        result = task;
      });

      const req = httpMock.expectOne(`${baseUrl}/api/tasks/1`);
      req.flush(serverResponse);

      expect(result?.taskStatus).toBe('done');
    });
  });
});
