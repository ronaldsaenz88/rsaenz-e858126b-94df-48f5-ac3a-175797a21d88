import { RolesGuard } from '@libs/auth/src/lib/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { ROLES_KEY } from '@libs/auth/src/lib/roles.decorator';
import { Role } from '@libs/auth/src/lib/roles.enum';

function buildMockContext(user: { roles?: string[] }, handler = {}, cls = {}): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles decorator is applied', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(buildMockContext({ roles: [] }))).toBe(true);
  });

  it('should allow owner to access an owner-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Owner]);
    expect(guard.canActivate(buildMockContext({ roles: ['owner'] }))).toBe(true);
  });

  it('should allow admin to access an admin-or-owner route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Owner, Role.Admin]);
    expect(guard.canActivate(buildMockContext({ roles: ['admin'] }))).toBe(true);
  });

  it('should allow viewer to access a route open to all roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Owner, Role.Admin, Role.Viewer]);
    expect(guard.canActivate(buildMockContext({ roles: ['viewer'] }))).toBe(true);
  });

  it('should deny viewer access to an owner-only route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Owner]);
    expect(guard.canActivate(buildMockContext({ roles: ['viewer'] }))).toBe(false);
  });

  it('should deny viewer access to an admin-or-owner route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Owner, Role.Admin]);
    expect(guard.canActivate(buildMockContext({ roles: ['viewer'] }))).toBe(false);
  });

  it('should deny access when user has no roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(guard.canActivate(buildMockContext({ roles: [] }))).toBe(false);
  });

  it('should deny access when user roles are undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(guard.canActivate(buildMockContext({}))).toBe(false);
  });

  it('should read metadata using the ROLES_KEY', () => {
    const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const handler = {};
    const cls = {};
    guard.canActivate(buildMockContext({ roles: ['viewer'] }, handler, cls));
    expect(spy).toHaveBeenCalledWith(ROLES_KEY, [handler, cls]);
  });
});
