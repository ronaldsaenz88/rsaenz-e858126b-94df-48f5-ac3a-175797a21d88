import { Entity, Column, OneToMany, ManyToOne } from 'typeorm';
import { BaseEntityModel } from './base';
import { User } from './user';

@Entity()
export class Organization extends BaseEntityModel {
  @Column()
  name: string;

  @ManyToOne(() => Organization, { nullable: true })
  parent: Organization;

  @OneToMany(() => User, user => user.organization)
  users: User[];
}
