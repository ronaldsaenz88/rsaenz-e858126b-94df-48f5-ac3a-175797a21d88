import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

jest.mock('bcryptjs', () => ({
  compareSync: jest.fn(),
}));
import * as bcrypt from 'bcryptjs';


describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;


  // Mock user matches the shape returned by the DB (with relations, including role permissions)
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    roles: [{ name: 'viewer', permissions: [{ name: 'task:read' }] }],
    organization: { id: 1, name: 'org1' },
  };

  const mockUserService = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should return user with mapped roles, permissions, and orgId if credentials are valid', async () => {
      mockUserService.findOne.mockResolvedValue({ ...mockUser });
      (bcrypt.compareSync as jest.Mock).mockReturnValueOnce(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual({ id: '1', email: 'test@example.com', roles: ['viewer'], permissions: ['task:read'], orgId: '1' });
      expect(mockUserService.findOne).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compareSync).toHaveBeenCalledWith('password', 'hashedpassword');
    });

    it('should return null if user not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      const result = await service.validateUser('wrong@example.com', 'password');
      expect(result).toBeNull();
      expect(mockUserService.findOne).toHaveBeenCalledWith('wrong@example.com');
    });

    it('should return null if password does not match', async () => {
      mockUserService.findOne.mockResolvedValue({ ...mockUser });
      (bcrypt.compareSync as jest.Mock).mockReturnValueOnce(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');
      expect(result).toBeNull();
      expect(bcrypt.compareSync).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
    });

    it('should return empty roles, permissions, and orgId if user has no roles or organization', async () => {
      const userNoRelations = { id: 2, email: 'bare@example.com', password: 'hash', roles: [], organization: null };
      mockUserService.findOne.mockResolvedValue(userNoRelations);
      (bcrypt.compareSync as jest.Mock).mockReturnValueOnce(true);

      const result = await service.validateUser('bare@example.com', 'password');
      expect(result).toEqual({ id: '2', email: 'bare@example.com', roles: [], permissions: [], orgId: '' });
    });

    it('should deduplicate permissions shared across multiple roles', async () => {
      const multiRoleUser = {
        id: 3,
        email: 'multi@example.com',
        password: 'hash',
        roles: [
          { name: 'admin', permissions: [{ name: 'task:create' }, { name: 'task:read' }, { name: 'task:update' }, { name: 'task:delete' }] },
          { name: 'viewer', permissions: [{ name: 'task:read' }] }, // task:read duplicated
        ],
        organization: { id: 1, name: 'org1' },
      };
      mockUserService.findOne.mockResolvedValue(multiRoleUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValueOnce(true);

      const result = await service.validateUser('multi@example.com', 'password');
      expect(result).not.toBeNull();
      // task:read must appear only once
      expect(result!.permissions.filter(p => p === 'task:read')).toHaveLength(1);
      expect(result!.permissions).toEqual(expect.arrayContaining(['task:create', 'task:read', 'task:update', 'task:delete']));
    });
  });

  describe('login', () => {
    it('should return an access_token with correct payload including permissions', async () => {
      const user = { email: 'test@example.com', id: '1', roles: ['viewer'], permissions: ['task:read'], orgId: '1' };
      mockJwtService.sign.mockReturnValue('signed.jwt.token');

      const result = await service.login(user);
      expect(result).toEqual({ access_token: 'signed.jwt.token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: 'test@example.com',
        sub: '1',
        roles: ['viewer'],
        permissions: ['task:read'],
        orgId: '1',
      });
    });
  });
});