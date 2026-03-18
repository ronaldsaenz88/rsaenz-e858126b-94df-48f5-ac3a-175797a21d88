import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@libs/data/src/entities/audit-log';

export interface AuditLogEntry {
  userId: string;
  userEmail?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  orgId?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>
  ) {}

  /**
   * Records an audit log entry.
   * @param entry - The audit log data to record.
   */
  async log(entry: AuditLogEntry): Promise<void> {
    const record = this.auditLogRepository.create({
      userId: entry.userId,
      userEmail: entry.userEmail,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      orgId: entry.orgId,
      details: entry.details ? JSON.stringify(entry.details) : undefined,
    });
    await this.auditLogRepository.save(record);
    // Also log to console for immediate visibility
    console.log(`[AUDIT] ${entry.action} by user ${entry.userEmail ?? entry.userId}`, entry.details ?? '');
  }

  /**
   * Retrieves all audit log entries.
   * @returns An array of audit log entries.
   */
  findAll(): Promise<AuditLog[]> {
    return this.auditLogRepository.find({ order: { createdAt: 'DESC' } });
  }
}
