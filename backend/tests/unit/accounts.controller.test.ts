import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Response } from 'express';

// Mock the database module
vi.mock('../../src/db.js', () => ({
  db: {
    query: {
      accounts: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      transactions: {
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
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

// Mock the translation service
vi.mock('../../src/services/auto-translate.service.js', () => ({
  translationQueue: {
    add: vi.fn(),
  },
}));

import { AccountsController } from '../../src/controllers/accounts.controller.js';
import { db } from '../../src/db.js';
import type { AuthRequest } from '../../src/middleware/auth.js';

describe('AccountsController', () => {
  let accountsController: AccountsController;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let responseJson: any;
  let responseStatus: number;

  beforeEach(() => {
    accountsController = new AccountsController();
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
      send: vi.fn().mockReturnThis(),
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should return 400 if name is missing', async () => {
      mockRequest = {
        userId: 'test-user-id',
        body: {
          type: 'bank',
          currency: 'EUR',
        },
      };

      await accountsController.create(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(400);
      expect(responseJson.error).toBe('Validation error');
    });

    it('should return 400 if type is invalid', async () => {
      mockRequest = {
        userId: 'test-user-id',
        body: {
          name: 'My Account',
          type: 'invalid-type',
          currency: 'EUR',
        },
      };

      await accountsController.create(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(400);
      expect(responseJson.error).toBe('Validation error');
    });

    it('should return 400 if currency is not 3 characters', async () => {
      mockRequest = {
        userId: 'test-user-id',
        body: {
          name: 'My Account',
          type: 'bank',
          currency: 'EURO',
        },
      };

      await accountsController.create(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(400);
      expect(responseJson.error).toBe('Validation error');
    });

    it('should successfully create a bank account', async () => {
      const mockAccountId = 'new-account-id';
      const mockAccount = {
        id: mockAccountId,
        userId: 'test-user-id',
        name: 'Main Bank Account',
        type: 'bank',
        currency: 'EUR',
        openingBalanceCents: 100000, // 1000 EUR
        createdAt: new Date(),
      };

      mockRequest = {
        userId: 'test-user-id',
        body: {
          name: 'Main Bank Account',
          type: 'bank',
          currency: 'EUR',
          openingBalanceCents: 100000,
        },
      };

      // Mock insert chain for account creation
      const mockReturning = vi.fn().mockResolvedValueOnce([mockAccount]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      vi.mocked(db.insert).mockReturnValueOnce({ values: mockValues } as any);

      // Mock insert for opening balance transaction (for bank accounts)
      const mockTxReturning = vi.fn().mockResolvedValueOnce([{}]);
      const mockTxValues = vi.fn().mockReturnValue({ returning: mockTxReturning });
      vi.mocked(db.insert).mockReturnValueOnce({ values: mockTxValues } as any);

      // Mock update to set openingBalanceCents to 0 for bank accounts
      const mockWhere = vi.fn().mockResolvedValueOnce([]);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.update).mockReturnValueOnce({ set: mockSet } as any);

      await accountsController.create(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(201);
      expect(responseJson.id).toBe(mockAccountId);
      expect(responseJson.name).toBe('Main Bank Account');
      expect(responseJson.type).toBe('bank');
      expect(responseJson.currency).toBe('EUR');
    });

    it('should successfully create a savings account without transaction', async () => {
      const mockAccountId = 'savings-account-id';
      const mockAccount = {
        id: mockAccountId,
        userId: 'test-user-id',
        name: 'Savings',
        type: 'savings',
        currency: 'EUR',
        openingBalanceCents: 500000, // 5000 EUR
        createdAt: new Date(),
      };

      mockRequest = {
        userId: 'test-user-id',
        body: {
          name: 'Savings',
          type: 'savings',
          currency: 'EUR',
          openingBalanceCents: 500000,
        },
      };

      // Mock insert chain for account creation
      const mockReturning = vi.fn().mockResolvedValueOnce([mockAccount]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      vi.mocked(db.insert).mockReturnValueOnce({ values: mockValues } as any);

      await accountsController.create(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(201);
      expect(responseJson.id).toBe(mockAccountId);
      expect(responseJson.type).toBe('savings');
      // Opening balance should be returned as currentBalanceCents
      expect(responseJson.currentBalanceCents).toBe(500000);
    });

    it('should create account with zero opening balance by default', async () => {
      const mockAccount = {
        id: 'account-id',
        userId: 'test-user-id',
        name: 'Cash',
        type: 'cash',
        currency: 'EUR',
        openingBalanceCents: 0,
        createdAt: new Date(),
      };

      mockRequest = {
        userId: 'test-user-id',
        body: {
          name: 'Cash',
          type: 'cash',
          currency: 'EUR',
          // No openingBalanceCents provided
        },
      };

      const mockReturning = vi.fn().mockResolvedValueOnce([mockAccount]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      vi.mocked(db.insert).mockReturnValueOnce({ values: mockValues } as any);

      await accountsController.create(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(201);
      expect(responseJson.openingBalanceCents).toBe(0);
    });
  });

  describe('update', () => {
    it('should return 404 if account not found', async () => {
      mockRequest = {
        userId: 'test-user-id',
        params: { id: 'nonexistent-account-id' },
        body: { name: 'Updated Name' },
      };

      // Mock update chain returning empty array (no account found)
      const mockReturning = vi.fn().mockResolvedValueOnce([]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.update).mockReturnValueOnce({ set: mockSet } as any);

      await accountsController.update(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(404);
      expect(responseJson.error).toBe('Account not found');
    });

    it('should successfully update account name', async () => {
      const updatedAccount = {
        id: 'account-id',
        userId: 'test-user-id',
        name: 'Updated Account Name',
        type: 'bank',
        currency: 'EUR',
        updatedAt: new Date(),
      };

      mockRequest = {
        userId: 'test-user-id',
        params: { id: 'account-id' },
        body: { name: 'Updated Account Name' },
      };

      const mockReturning = vi.fn().mockResolvedValueOnce([updatedAccount]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.update).mockReturnValueOnce({ set: mockSet } as any);

      await accountsController.update(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(200);
      expect(responseJson.name).toBe('Updated Account Name');
    });
  });

  describe('archive (delete)', () => {
    it('should return 404 if account not found', async () => {
      mockRequest = {
        userId: 'test-user-id',
        params: { id: 'nonexistent-account-id' },
      };

      // Mock delete for transactions
      const mockTxWhere = vi.fn().mockResolvedValueOnce([]);
      vi.mocked(db.delete).mockReturnValueOnce({ where: mockTxWhere } as any);

      // Mock delete for account returning empty array
      const mockReturning = vi.fn().mockResolvedValueOnce([]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      vi.mocked(db.delete).mockReturnValueOnce({ where: mockWhere } as any);

      await accountsController.archive(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(404);
      expect(responseJson.error).toBe('Account not found');
    });

    it('should successfully delete account and its transactions', async () => {
      const deletedAccount = {
        id: 'account-id',
        name: 'Deleted Account',
      };

      mockRequest = {
        userId: 'test-user-id',
        params: { id: 'account-id' },
      };

      // Mock delete for transactions
      const mockTxWhere = vi.fn().mockResolvedValueOnce([]);
      vi.mocked(db.delete).mockReturnValueOnce({ where: mockTxWhere } as any);

      // Mock delete for account
      const mockReturning = vi.fn().mockResolvedValueOnce([deletedAccount]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      vi.mocked(db.delete).mockReturnValueOnce({ where: mockWhere } as any);

      await accountsController.archive(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(204);
    });
  });
});
