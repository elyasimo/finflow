import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the database module
vi.mock('../../src/db.js', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      categories: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
  },
}));

import { AuthController } from '../../src/controllers/auth.controller.js';
import { db } from '../../src/db.js';

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: any;
  let responseStatus: number;

  beforeEach(() => {
    authController = new AuthController();
    responseJson = null;
    responseStatus = 200;

    mockResponse = {
      status: vi.fn().mockImplementation((code: number) => {
        responseStatus = code;
        return mockResponse;
      }),
      json: vi.fn().mockImplementation((data: any) => {
        responseJson = data;
        return mockResponse;
      }),
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('register', () => {
    it('should return 400 if email is invalid', async () => {
      mockRequest = {
        body: {
          email: 'invalid-email',
          password: 'password123',
        },
      };

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toBe(400);
      expect(responseJson.error).toBe('Validation error');
    });

    it('should return 400 if password is too short', async () => {
      mockRequest = {
        body: {
          email: 'test@example.com',
          password: 'short',
        },
      };

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toBe(400);
      expect(responseJson.error).toBe('Validation error');
    });

    it('should return 400 if email already exists', async () => {
      mockRequest = {
        body: {
          email: 'existing@example.com',
          password: 'password123',
        },
      };

      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce({
        id: 'existing-user-id',
        email: 'existing@example.com',
      } as any);

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toBe(400);
      expect(responseJson.error).toBe('Email already registered');
    });

    it('should successfully register a new user', async () => {
      const mockUserId = 'new-user-id';
      const mockToken = 'mock-jwt-token';

      mockRequest = {
        body: {
          email: 'newuser@example.com',
          password: 'password123',
        },
      };

      // User doesn't exist
      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(null as any);

      // Mock insert chain for user creation
      const mockReturning = vi.fn().mockResolvedValueOnce([{
        id: mockUserId,
        email: 'newuser@example.com',
        createdAt: new Date(),
      }]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      vi.mocked(db.insert).mockReturnValueOnce({ values: mockValues } as any);

      // Mock insert chain for categories
      const mockCategoryReturning = vi.fn().mockResolvedValueOnce([]);
      const mockCategoryValues = vi.fn().mockReturnValue({ returning: mockCategoryReturning });
      vi.mocked(db.insert).mockReturnValueOnce({ values: mockCategoryValues } as any);

      // Mock JWT sign
      vi.spyOn(jwt, 'sign').mockReturnValueOnce(mockToken as any);

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toBe(201);
      expect(responseJson.user.id).toBe(mockUserId);
      expect(responseJson.user.email).toBe('newuser@example.com');
      expect(responseJson.accessToken).toBe(mockToken);
    });
  });

  describe('login', () => {
    it('should return 400 if email is invalid', async () => {
      mockRequest = {
        body: {
          email: 'invalid-email',
          password: 'password123',
        },
      };

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toBe(400);
      expect(responseJson.error).toBe('Validation error');
    });

    it('should return 401 if user not found', async () => {
      mockRequest = {
        body: {
          email: 'notfound@example.com',
          password: 'password123',
        },
      };

      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(null as any);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toBe(401);
      expect(responseJson.error).toBe('Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      mockRequest = {
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      };

      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce({
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('correctpassword', 10),
        isActive: true,
      } as any);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toBe(401);
      expect(responseJson.error).toBe('Invalid credentials');
    });

    it('should return 403 if account is deactivated', async () => {
      mockRequest = {
        body: {
          email: 'deactivated@example.com',
          password: 'password123',
        },
      };

      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce({
        id: 'user-id',
        email: 'deactivated@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        isActive: false,
      } as any);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toBe(403);
      expect(responseJson.error).toBe('Account is deactivated. Please contact support.');
    });

    it('should successfully login with valid credentials', async () => {
      const mockToken = 'mock-jwt-token';
      const passwordHash = await bcrypt.hash('password123', 10);

      mockRequest = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      };

      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce({
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash,
        isActive: true,
        role: 'user',
        createdAt: new Date(),
      } as any);

      // Mock update for lastLoginAt
      const mockWhere = vi.fn().mockResolvedValueOnce([]);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.update).mockReturnValueOnce({ set: mockSet } as any);

      // Mock JWT sign
      vi.spyOn(jwt, 'sign').mockReturnValueOnce(mockToken as any);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toBe(200);
      expect(responseJson.user.id).toBe('user-id');
      expect(responseJson.user.email).toBe('test@example.com');
      expect(responseJson.accessToken).toBe(mockToken);
    });
  });

  describe('getMe', () => {
    it('should return 404 if user not found', async () => {
      mockRequest = {
        userId: 'nonexistent-user-id',
      } as any;

      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce(null as any);

      await authController.getMe(mockRequest as any, mockResponse as Response);

      expect(responseStatus).toBe(404);
      expect(responseJson.error).toBe('User not found');
    });

    it('should return user data', async () => {
      mockRequest = {
        userId: 'user-id',
      } as any;

      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce({
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        defaultCurrency: 'EUR',
        createdAt: new Date(),
      } as any);

      await authController.getMe(mockRequest as any, mockResponse as Response);

      expect(responseStatus).toBe(200);
      expect(responseJson.id).toBe('user-id');
      expect(responseJson.email).toBe('test@example.com');
      expect(responseJson.name).toBe('Test User');
      expect(responseJson.defaultCurrency).toBe('EUR');
    });
  });

  describe('changePassword', () => {
    it('should return 400 if current password is missing', async () => {
      mockRequest = {
        userId: 'user-id',
        body: {
          newPassword: 'newpassword123',
        },
      } as any;

      await authController.changePassword(mockRequest as any, mockResponse as Response);

      expect(responseStatus).toBe(400);
      expect(responseJson.error).toBe('Current password and new password are required');
    });

    it('should return 400 if new password is too short', async () => {
      mockRequest = {
        userId: 'user-id',
        body: {
          currentPassword: 'oldpassword',
          newPassword: 'short',
        },
      } as any;

      await authController.changePassword(mockRequest as any, mockResponse as Response);

      expect(responseStatus).toBe(400);
      expect(responseJson.error).toBe('New password must be at least 8 characters long');
    });

    it('should return 401 if current password is incorrect', async () => {
      mockRequest = {
        userId: 'user-id',
        body: {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        },
      } as any;

      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce({
        id: 'user-id',
        passwordHash: await bcrypt.hash('correctpassword', 10),
      } as any);

      await authController.changePassword(mockRequest as any, mockResponse as Response);

      expect(responseStatus).toBe(401);
      expect(responseJson.error).toBe('Current password is incorrect');
    });

    it('should successfully change password', async () => {
      const currentPassword = 'oldpassword123';
      
      mockRequest = {
        userId: 'user-id',
        body: {
          currentPassword,
          newPassword: 'newpassword123',
        },
      } as any;

      vi.mocked(db.query.users.findFirst).mockResolvedValueOnce({
        id: 'user-id',
        passwordHash: await bcrypt.hash(currentPassword, 10),
      } as any);

      // Mock update chain
      const mockReturning = vi.fn().mockResolvedValueOnce([]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.update).mockReturnValueOnce({ set: mockSet } as any);

      await authController.changePassword(mockRequest as any, mockResponse as Response);

      expect(responseStatus).toBe(200);
      expect(responseJson.message).toBe('Password updated successfully');
    });
  });
});
