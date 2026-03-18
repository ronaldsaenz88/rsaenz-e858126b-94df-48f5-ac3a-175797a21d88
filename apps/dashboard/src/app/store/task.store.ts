import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TasksService } from '../services/tasks.service';
import { Task } from '../models/task.model';

/**
 * Signal-based store for task state management.
 *
 * Holds the canonical tasks list as an Angular Signal so every component that
 * reads `tasks` automatically re-renders when the list changes — eliminating
 * the need for each component to maintain its own local copy and re-fetch
 * data on every visit.
 */
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private tasksService = inject(TasksService);

  // ── private mutable signals ───────────────────────────────────────────────
  private _tasks = signal<Task[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // ── public read-only signals ──────────────────────────────────────────────
  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // ── actions ───────────────────────────────────────────────────────────────

  /** Fetch all tasks from the API and populate the store. */
  loadTasks(): void {
    this._loading.set(true);
    this._error.set(null);
    this.tasksService.getTasks().subscribe({
      next: tasks => {
        this._tasks.set(tasks);
        this._loading.set(false);
      },
      error: err => {
        this._error.set('Failed to load tasks');
        this._loading.set(false);
        console.error('TaskStore.loadTasks error:', err);
      },
    });
  }

  /**
   * Return a single task.  If it already exists in the store cache it is
   * returned immediately (no network request); otherwise it is fetched from
   * the API and merged into the store for future cache hits.
   */
  getTask(id: number): Observable<Task> {
    const cached = this._tasks().find(t => t.id === id);
    if (cached) {
      return of(cached);
    }
    return this.tasksService.getTask(id).pipe(
      tap(fetched =>
        this._tasks.update(ts => {
          const exists = ts.some(t => t.id === fetched.id);
          return exists
            ? ts.map(t => (t.id === fetched.id ? fetched : t))
            : [...ts, fetched];
        }),
      ),
    );
  }

  /** Create a new task and append it to the store. */
  addTask(task: Task): Observable<Task> {
    return this.tasksService.addTask(task).pipe(
      tap(created => this._tasks.update(ts => [...ts, created])),
    );
  }

  /** Update an existing task and patch it in the store. */
  updateTask(id: number, dto: Partial<Task>): Observable<Task> {
    return this.tasksService.updateTask(id, dto).pipe(
      tap(updated =>
        this._tasks.update(ts =>
          ts.map(t => (t.id === id ? { ...t, ...updated } : t)),
        ),
      ),
    );
  }

  /** Delete a task and remove it from the store. */
  deleteTask(id: number): Observable<void> {
    return this.tasksService.deleteTask(id).pipe(
      tap(() => this._tasks.update(ts => ts.filter(t => t.id !== id))),
    );
  }
}
