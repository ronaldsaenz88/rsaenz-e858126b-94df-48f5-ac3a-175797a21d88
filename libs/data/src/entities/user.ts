import { Entity, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntityModel } from './base';
import { Organization } from './organization';
import { Role } from './role';

@Entity()
export class User extends BaseEntityModel {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Organization, org => org.users)
  organization: Organization;

  @ManyToMany(() => Role)
  @JoinTable()
  roles: Role[];
}
