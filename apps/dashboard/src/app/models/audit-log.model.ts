export interface AuditLog {
  id: number;
  userId: string;
  userEmail?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  orgId?: string;
  details?: string;
  createdAt: string;
}
