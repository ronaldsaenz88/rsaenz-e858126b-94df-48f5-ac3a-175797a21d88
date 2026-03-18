import { Component, OnInit, effect, inject } from '@angular/core';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TASK_CATEGORIES, TASK_STATUSES } from '../../constants/tasks';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Task } from '../../models/task.model';
import { TaskStore } from '../../store/task.store';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tasks-board',
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './tasks-board.component.html',
  styleUrls: ['./tasks-board.component.css']
})
export class TasksBoardComponent implements OnInit {
  // Stable per-column arrays so CDK drag-drop always references the same object
  columnTasks: Record<string, Task[]> = Object.fromEntries(
    TASK_STATUSES.map(s => [s, [] as Task[]])
  );
  filterCategory = '';
  filterStatus = '';
  filterText = '';
  sortColumn = '';
  sortAsc = true;
  categories = TASK_CATEGORIES;
  statuses = TASK_STATUSES;

  get tasks(): Task[] { return this.taskStore.tasks(); }

  get filteredTasks(): Task[] {
    const filtered = this.taskStore.tasks().filter(t =>
      (!this.filterCategory || t.category === this.filterCategory) &&
      (!this.filterStatus   || t.taskStatus === this.filterStatus) &&
      (!this.filterText ||
        t.title.toLowerCase().includes(this.filterText.toLowerCase()) ||
        (t.description ?? '').toLowerCase().includes(this.filterText.toLowerCase()))
    );
    if (!this.sortColumn) return filtered;
    return [...filtered].sort((a, b) => {
      const col = this.sortColumn as keyof Task;
      const aVal = (a[col] ?? '') as string;
      const bVal = (b[col] ?? '') as string;
      return this.sortAsc
        ? aVal.toString().localeCompare(bVal.toString())
        : bVal.toString().localeCompare(aVal.toString());
    });
  }

  setSort(column: string) {
    if (this.sortColumn === column) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = column;
      this.sortAsc = true;
    }
  }

  // Constructor using inject (Angular 16+)
  private taskStore = inject(TaskStore);
  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {
    // effect() must be called in an injection context (constructor/field initializer).
    // It automatically re-runs whenever the taskStore.tasks signal changes.
    effect(() => this.rebuildColumns(this.taskStore.tasks()));
  }

  // Permission helpers
  get canCreate(): boolean { return this.authService.hasPermission('task:create'); }
  get canEdit(): boolean   { return this.authService.hasPermission('task:update'); }
  get canDelete(): boolean { return this.authService.hasPermission('task:delete'); }
  get canDrag(): boolean   { return this.authService.hasPermission('task:update'); }

  ngOnInit() {
    this.taskStore.loadTasks();
  }

  // Rebuild stable column arrays from the provided tasks applying current filters
  private rebuildColumns(tasks: Task[]) {
    this.statuses.forEach(status => {
      const filtered = tasks
        .filter(t => t.taskStatus === status)
        .filter(t =>
          (!this.filterCategory || t.category === this.filterCategory) &&
          (!this.filterText ||
            t.title.toLowerCase().includes(this.filterText.toLowerCase()) ||
            (t.description ?? '').toLowerCase().includes(this.filterText.toLowerCase()))
        );
      // Mutate in place (instead of reassigning) so Angular CDK drag-drop always
      // holds the same array reference for each column and doesn't lose its state.
      this.columnTasks[status].length = 0;
      this.columnTasks[status].push(...filtered);
    });
  }

  onFilterChange() {
    this.rebuildColumns(this.taskStore.tasks());
  }

  drop(event: CdkDragDrop<Task[]>, status: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const previousStatus = task.taskStatus;

      // Optimistically move the card in the UI
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update in DB via store — store patches the signal on success
      this.taskStore.updateTask(task.id!, { taskStatus: status }).subscribe({
        next: updatedTask => {
          console.log('Task status updated in DB:', updatedTask);
        },
        error: err => {
          // The store signal was NOT updated (tap only runs on success), so
          // rebuilding columns from the signal automatically reverts the UI.
          console.error('Failed to update task status:', err);
          this.rebuildColumns(this.taskStore.tasks());
        }
      });
    }
  }

  listTasks() {
    this.router.navigate(['/tasks', 'list']);
  }

  addTask() {
    this.router.navigate(['/tasks', 'add']);
  }

  editTask(task: Task) {
    this.router.navigate(['/tasks', 'edit', task.id]);
  }

  deleteTask(task: Task) {
    if (!task.id) return; // Safety check
    this.taskStore.deleteTask(task.id).subscribe({
      error: err => {
        console.error('Delete failed', err);
      }
    });
  }

}