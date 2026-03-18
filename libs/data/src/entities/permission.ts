import { Entity, Column } from 'typeorm';
import { BaseEntityModel } from './base';

@Entity()
export class Permission extends BaseEntityModel {
  @Column({ unique: true })
  name: string;
}
