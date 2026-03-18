import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Handles user login.
   * Validates credentials and returns a JWT token with roles sourced from the database.
   * Roles are never taken from the request body to prevent privilege escalation.
   *
   * @param body - The request body containing email and password.
   * @returns A JWT token if login is successful.
   * @throws UnauthorizedException if the credentials are invalid.
   */
  @Post('login')
  async login(@Body() body) {
    // Validate request body
    if (!body.email || !body.password) {
      throw new Error('Email and password are required');
    }

    // Validate user credentials and get roles/orgId from the database
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Roles and orgId come from the database (via validateUser), not from the request body
    return this.authService.login(user);
  }
}