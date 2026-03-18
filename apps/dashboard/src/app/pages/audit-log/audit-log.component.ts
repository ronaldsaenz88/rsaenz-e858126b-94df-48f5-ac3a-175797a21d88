import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLog } from '../../models/audit-log.model';
import { AuditLogService } from '../../services/audit-log.service';

@Component({
  selector: 'app-audit-log',
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.css']
})
export class AuditLogComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  filterText = '';
  filterAction = '';
  isLoading = false;
  errorMessage = '';

  // Constructor using inject (Angular 16+)
  private auditLogService = inject(AuditLogService);

  get uniqueActions(): string[] {
    return [...new Set(this.auditLogs.map(log => log.action))].sort();
  }

  get filteredLogs(): AuditLog[] {
    return this.auditLogs.filter(log =>
      (!this.filterAction || log.action === this.filterAction) &&
      (
        !this.filterText ||
        (log.userEmail ?? '').toLowerCase().includes(this.filterText.toLowerCase()) ||
        log.action.toLowerCase().includes(this.filterText.toLowerCase()) ||
        (log.resource ?? '').toLowerCase().includes(this.filterText.toLowerCase()) ||
        (log.resourceId ?? '').toLowerCase().includes(this.filterText.toLowerCase())
      )
    );
  }

  ngOnInit() {
    this.isLoading = true;
    this.auditLogService.getAuditLogs().subscribe({
      next: logs => {
        this.auditLogs = logs;
        this.isLoading = false;
      },
      error: err => {
        console.error('Failed to load audit logs:', err);
        this.errorMessage = 'Failed to load audit logs. Please try again.';
        this.isLoading = false;
      }
    });
  }

  formatDetails(details?: string): string {
    if (!details) return '';
    try {
      return JSON.stringify(JSON.parse(details), null, 2);
    } catch {
      return details;
    }
  }
}
