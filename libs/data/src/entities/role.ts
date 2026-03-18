import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntityModel } from './base';
import { Permission } from './permission';

@Entity()
export class Role extends BaseEntityModel {
  @Column({ unique: true })
  name: string; // Owner, Admin, Viewer

  @ManyToMany(() => Permission)
  @JoinTable()
  permissions: Permission[];
}
