import { Component, OnInit, inject } from '@angular/core';
import { TASK_CATEGORIES, TASK_STATUSES } from '../../constants/tasks';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Task } from '../../models/task.model';
import { TaskStore } from '../../store/task.store';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tasks-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks-list.component.html',
  styleUrls: ['./tasks-list.component.css']
})
export class TasksListComponent implements OnInit {
  filterCategory = '';
  filterStatus = '';
  filterText = '';
  sortColumn: keyof Task | '' = '';
  sortAsc = true;
  categories = TASK_CATEGORIES;
  statuses = TASK_STATUSES;

  // Constructor using inject (Angular 16+)
  readonly taskStore = inject(TaskStore);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Permission helpers
  get canCreate(): boolean { return this.authService.hasPermission('task:create'); }
  get canEdit(): boolean   { return this.authService.hasPermission('task:update'); }
  get canDelete(): boolean { return this.authService.hasPermission('task:delete'); }

  ngOnInit() {
    this.taskStore.loadTasks();
  }

  get filteredTasks() {
    let filtered = this.taskStore.tasks().filter(task =>
      (!this.filterCategory || task.category === this.filterCategory) &&
      (!this.filterStatus || task.taskStatus === this.filterStatus) &&
      (
        !this.filterText ||
        task.title.toLowerCase().includes(this.filterText.toLowerCase()) ||
        (task.description ?? '').toLowerCase().includes(this.filterText.toLowerCase())
      )
    );

    if (this.sortColumn) {
      filtered = filtered.sort((a, b) => {
        const valA = this.sortColumn ? a[this.sortColumn] : null;
        const valB = this.sortColumn ? b[this.sortColumn] : null;
        if ((valA ?? '') < (valB ?? '')) return this.sortAsc ? -1 : 1;
        if ((valA ?? '') > (valB ?? '')) return this.sortAsc ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }

  setSort(column: keyof Task) {
    if (this.sortColumn === column) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = column;
      this.sortAsc = true;
    }
  }

  showTaskBoard() {
    this.router.navigate(['/tasks']);
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