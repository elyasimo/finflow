import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../../src/middleware/auth.js';

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let responseJson: any;
  let responseStatus: number;

  beforeEach(() => {
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

    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 if no authorization header', () => {
    mockRequest = {
      headers: {},
    };

    authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(responseStatus).toBe(401);
    expect(responseJson.error).toBe('Missing or invalid authorization header');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header does not start with Bearer', () => {
    mockRequest = {
      headers: {
        authorization: 'Basic sometoken',
      },
    };

    authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(responseStatus).toBe(401);
    expect(responseJson.error).toBe('Missing or invalid authorization header');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    mockRequest = {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    };

    authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(responseStatus).toBe(401);
    expect(responseJson.error).toBe('Invalid token');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if token is expired', () => {
    const secret = 'test-secret';
    process.env.JWT_SECRET = secret;

    // Create an expired token
    const expiredToken = jwt.sign(
      { userId: 'test-user-id' },
      secret,
      { expiresIn: '-1s' }, // Already expired
    );

    mockRequest = {
      headers: {
        authorization: `Bearer ${expiredToken}`,
      },
    };

    authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(responseStatus).toBe(401);
    // JWT library may return 'Invalid token' or 'Token expired' depending on the error type
    expect(['Token expired', 'Invalid token']).toContain(responseJson.error);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next and set userId for valid token', () => {
    const secret = 'test-secret';
    process.env.JWT_SECRET = secret;
    const userId = 'test-user-id';

    const validToken = jwt.sign(
      { userId },
      secret,
      { expiresIn: '1h' },
    );

    mockRequest = {
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    };

    authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.userId).toBe(userId);
    expect(mockRequest.user).toEqual({ id: userId, role: 'user' });
  });

  it('should set role from token if present', () => {
    const secret = 'test-secret';
    process.env.JWT_SECRET = secret;
    const userId = 'admin-user-id';
    const role = 'admin';

    const validToken = jwt.sign(
      { userId, role },
      secret,
      { expiresIn: '1h' },
    );

    mockRequest = {
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    };

    authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.userId).toBe(userId);
    expect(mockRequest.user).toEqual({ id: userId, role: 'admin' });
  });
});
