import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw error if email or password is missing', async () => {
      await expect(controller.login({ email: '', password: '' })).rejects.toThrow('Email and password are required');
      await expect(controller.login({ email: 'test@example.com' })).rejects.toThrow('Email and password are required');
      await expect(controller.login({ password: '123456' })).rejects.toThrow('Email and password are required');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);
      await expect(controller.login({ email: 'test@example.com', password: 'wrongpass' }))
        .rejects
        .toThrow(UnauthorizedException);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith('test@example.com', 'wrongpass');
    });

    it('should return JWT using roles and permissions from the database (not request body)', async () => {
      // validateUser returns roles and permissions from DB
      const userFromDb = { id: '1', email: 'test@example.com', roles: ['admin'], permissions: ['task:create', 'task:read', 'task:update', 'task:delete'], orgId: '1' };
      mockAuthService.validateUser.mockResolvedValue(userFromDb);
      mockAuthService.login.mockResolvedValue({ access_token: 'jwt.token' });

      // Request body may include roles but they should be ignored
      const result = await controller.login({
        email: 'test@example.com',
        password: 'goodpass',
        roles: ['owner'], // This should NOT override DB roles
        orgId: 'fake-org', // This should NOT be used
      });

      expect(result).toEqual({ access_token: 'jwt.token' });
      // login must be called with DB user (not with body roles)
      expect(mockAuthService.login).toHaveBeenCalledWith(userFromDb);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith('test@example.com', 'goodpass');
    });

    it('should pass validated user directly to login service', async () => {
      const userFromDb = { id: '2', email: 'viewer@example.com', roles: ['viewer'], permissions: ['task:read'], orgId: '2' };
      mockAuthService.validateUser.mockResolvedValue(userFromDb);
      mockAuthService.login.mockResolvedValue({ access_token: 'viewer.jwt.token' });

      const result = await controller.login({ email: 'viewer@example.com', password: 'goodpass' });
      expect(result).toEqual({ access_token: 'viewer.jwt.token' });
      expect(mockAuthService.login).toHaveBeenCalledWith(userFromDb);
    });
  });
});