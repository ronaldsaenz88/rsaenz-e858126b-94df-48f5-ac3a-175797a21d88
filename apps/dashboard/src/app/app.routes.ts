import { Route } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { TasksBoardComponent } from './pages/tasks-board/tasks-board.component';
import { TasksListComponent } from './pages/tasks-list/tasks-list.component';
import { TaskFormComponent } from './pages/task-form/task-form.component';
import { AuditLogComponent } from './pages/audit-log/audit-log.component';
import { AuthGuard } from './guards/auth.guards';
import { TaskWriteGuard } from './guards/role.guard';
import { AuditReadGuard } from './guards/audit-read.guard';


export const appRoutes: Route[] = [
  { path: '', component: TasksListComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'tasks', component: TasksBoardComponent, canActivate: [AuthGuard] },
  { path: 'tasks/list', component: TasksListComponent, canActivate: [AuthGuard] },
  { path: 'tasks/add', component: TaskFormComponent, canActivate: [AuthGuard, TaskWriteGuard] },
  { path: 'tasks/edit/:id', component: TaskFormComponent, canActivate: [AuthGuard, TaskWriteGuard] },
  { path: 'audit-log', component: AuditLogComponent, canActivate: [AuthGuard, AuditReadGuard] },
];
