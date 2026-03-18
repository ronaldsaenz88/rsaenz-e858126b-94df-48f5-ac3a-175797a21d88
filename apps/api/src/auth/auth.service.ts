import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  /**
   * Validates a user by checking the email and password.
   * Returns user with roles (as string names), unique permissions derived from
   * those roles (loaded from DB), and orgId.
   * @param email - The email of the user.
   * @param pass - The password of the user.
   * @returns The user object if validation is successful, otherwise null.
   */
  async validateUser(email: string, pass: string): Promise<{ id: string; email: string; roles: string[]; permissions: string[]; orgId: string } | null> {
    const user = await this.userService.findOne(email);

    // Check if user exists and password matches
    if (user && bcrypt.compareSync(pass, user.password)) {
      // Collect unique permission names across all roles from the DB
      const permissionSet = new Set<string>();
      for (const role of user.roles ?? []) {
        for (const perm of role.permissions ?? []) {
          permissionSet.add(perm.name);
        }
      }

      return {
        id: user.id.toString(),
        email: user.email,
        // Map Role relation objects to their string names
        roles: user.roles?.map(r => r.name) ?? [],
        // DB-sourced permissions (unique, flat list)
        permissions: Array.from(permissionSet),
        // Extract orgId from the organization relation
        orgId: user.organization?.id?.toString() ?? '',
      };
    }
    return null;
  }

  /**
   * Logs in a user by generating a JWT token.
   * @param user - The user object containing email, id, roles, permissions, and orgId.
   * @returns An object containing the access token.
   */
  async login(user: { email: string; id: string; roles: string[]; permissions: string[]; orgId: string }) {
    // Include roles, permissions, and org in JWT payload
    const payload = { username: user.email, sub: user.id, roles: user.roles, permissions: user.permissions, orgId: user.orgId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}