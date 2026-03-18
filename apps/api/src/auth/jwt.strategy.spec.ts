import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  describe('validate', () => {
    it('should map JWT payload to a user object with all fields', async () => {
      const payload = {
        sub: '1',
        username: 'admin@test.com',
        roles: ['admin'],
        permissions: ['task:create', 'task:read', 'task:update', 'task:delete'],
        orgId: '1',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: '1',
        username: 'admin@test.com',
        roles: ['admin'],
        permissions: ['task:create', 'task:read', 'task:update', 'task:delete'],
        orgId: '1',
      });
    });

    it('should default roles, permissions, and orgId when absent from payload', async () => {
      const payload = { sub: '2', username: 'viewer@test.com' } as any;

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: '2',
        username: 'viewer@test.com',
        roles: [],
        permissions: [],
        orgId: '',
      });
    });

    it('should include all owner permissions from the payload', async () => {
      const payload = {
        sub: '3',
        username: 'owner@test.com',
        roles: ['owner'],
        permissions: ['task:create', 'task:read', 'task:update', 'task:delete', 'audit:read'],
        orgId: '2',
      };

      const result = await strategy.validate(payload);

      expect(result.permissions).toEqual(
        expect.arrayContaining(['task:create', 'task:read', 'task:update', 'task:delete', 'audit:read'])
      );
      expect(result.roles).toEqual(['owner']);
      expect(result.orgId).toBe('2');
    });

    it('should map sub to userId', async () => {
      const payload = {
        sub: '99',
        username: 'someone@test.com',
        roles: ['viewer'],
        permissions: ['task:read'],
        orgId: '5',
      };

      const result = await strategy.validate(payload);

      expect(result.userId).toBe('99');
    });
  });
});
