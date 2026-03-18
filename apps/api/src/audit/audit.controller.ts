import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '@libs/auth/src/lib/roles.decorator';
import { RolesGuard } from '@libs/auth/src/lib/roles.guard';
import { Role } from '@libs/auth/src/lib/roles.enum';
import { AuditService } from './audit.service';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Retrieves all audit log entries.
   * Access is restricted to Owner and Admin roles only.
   * @returns An array of audit log entries.
   */
  @Get()
  @Roles(Role.Owner, Role.Admin)
  async findAll(@Request() req) {
    return this.auditService.findAll();
  }
}
