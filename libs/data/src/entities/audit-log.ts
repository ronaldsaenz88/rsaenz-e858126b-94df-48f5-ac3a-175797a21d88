import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column()
  action: string; // e.g. 'CREATE_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'VIEW_TASKS'

  @Column({ nullable: true })
  resource: string; // e.g. 'task'

  @Column({ nullable: true })
  resourceId: string;

  @Column({ nullable: true })
  orgId: string;

  @Column({ nullable: true })
  details: string; // JSON string with additional context

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
