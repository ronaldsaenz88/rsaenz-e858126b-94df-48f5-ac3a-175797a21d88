import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@libs/data/src/entities/user';

/**
 * UserService provides methods to interact with the User entity.
 * It allows finding a user by email, including their organization and roles.
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  /**
   * Finds a user by its email with relations.
   * @param email - The email of the user to find.
   * @returns The found user or null if not found.
   */
  async findOne(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email }, relations: ['organization', 'roles', 'roles.permissions'] });
  }
}