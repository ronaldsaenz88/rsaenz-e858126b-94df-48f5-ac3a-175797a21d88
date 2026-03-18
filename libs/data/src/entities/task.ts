import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntityModel } from './base';
import { Organization } from './organization';
import { User } from './user';

export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'inprogress',
  Done = 'done',
  Archived = 'archived',
}

@Entity()
export class Task extends BaseEntityModel {
  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  category: string;

  @Column({ type: 'varchar', default: TaskStatus.Todo })
  taskStatus: TaskStatus;

  @Column({ nullable: true })
  dueDate: Date;

  @ManyToOne(() => User)
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  updatedBy: User;

  @ManyToOne(() => Organization, { nullable: true })
  organization: Organization;
}
