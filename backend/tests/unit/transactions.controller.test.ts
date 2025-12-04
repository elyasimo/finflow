import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Response } from 'express';

// Mock the database module
vi.mock('../../src/db.js', () => ({
  db: {
    query: {
      transactions: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      accounts: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      categories: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      users: {
        findFirst: vi.fn(),
      },
      budgets: {
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
      where: vi.fn(),
    })),
  },
}));

// Mock the auto-category detector
vi.mock('../../src/utils/auto-category-detector.js', () => ({
  detectCategory: vi.fn(),
  getCategoryIdByName: vi.fn(),
}));

import { TransactionsController } from '../../src/controllers/transactions.controller.js';
import { db } from '../../src/db.js';
import type { AuthRequest } from '../../src/middleware/auth.js';

describe('TransactionsController', () => {
  let transactionsController: TransactionsController;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let responseJson: any;
  let responseStatus: number;

  beforeEach(() => {
    transactionsController = new TransactionsController();
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

  describe('list', () => {
    it('should return empty array if no transactions', async () => {
      mockRequest = {
        userId: 'test-user-id',
        query: {},
      };

      vi.mocked(db.query.transactions.findMany).mockResolvedValueOnce([]);

      await transactionsController.list(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(200);
      expect(responseJson).toEqual([]);
    });

    it('should return transactions for user', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          userId: 'test-user-id',
          accountId: 'account-1',
          type: 'expense',
          amountCents: 5000,
          currency: 'EUR',
          date: new Date(),
          description: 'Groceries',
          category: { id: 'cat-1', name: 'Food' },
          account: { id: 'account-1', name: 'Bank' },
        },
        {
          id: 'tx-2',
          userId: 'test-user-id',
          accountId: 'account-1',
          type: 'income',
          amountCents: 300000,
          currency: 'EUR',
          date: new Date(),
          description: 'Salary',
          category: { id: 'cat-2', name: 'Income' },
          account: { id: 'account-1', name: 'Bank' },
        },
      ];

      mockRequest = {
        userId: 'test-user-id',
        query: {},
      };

      vi.mocked(db.query.transactions.findMany).mockResolvedValueOnce(mockTransactions as any);

      await transactionsController.list(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(200);
      expect(responseJson).toHaveLength(2);
      expect(responseJson[0].description).toBe('Groceries');
      expect(responseJson[1].description).toBe('Salary');
    });

    it('should filter transactions by accountId', async () => {
      mockRequest = {
        userId: 'test-user-id',
        query: { accountId: 'specific-account-id' },
      };

      vi.mocked(db.query.transactions.findMany).mockResolvedValueOnce([]);

      await transactionsController.list(mockRequest as AuthRequest, mockResponse as Response);

      expect(db.query.transactions.findMany).toHaveBeenCalled();
    });

    it('should filter transactions by date range', async () => {
      mockRequest = {
        userId: 'test-user-id',
        query: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-12-31T23:59:59.999Z',
        },
      };

      vi.mocked(db.query.transactions.findMany).mockResolvedValueOnce([]);

      await transactionsController.list(mockRequest as AuthRequest, mockResponse as Response);

      expect(db.query.transactions.findMany).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should return 400 if accountId is missing', async () => {
      mockRequest = {
        userId: 'test-user-id',
        body: {
          type: 'expense',
          amountCents: 5000,
          currency: 'EUR',
          date: new Date().toISOString(),
        },
      };

      await transactionsController.create(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(400);
      expect(responseJson.error).toBe('Validation error');
    });

    it('should return 400 if type is invalid', async () => {
      mockRequest = {
        userId: 'test-user-id',
        body: {
          accountId: 'account-id',
          type: 'invalid-type',
          amountCents: 5000,
          currency: 'EUR',
          date: new Date().toISOString(),
        },
      };

      await transactionsController.create(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(400);
      expect(responseJson.error).toBe('Validation error');
    });

    it('should return 400 if amountCents is negative', async () => {
      mockRequest = {
        userId: 'test-user-id',
        body: {
          accountId: 'account-id',
          type: 'expense',
          amountCents: -5000,
          currency: 'EUR',
          date: new Date().toISOString(),
        },
      };

      await transactionsController.create(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(400);
      expect(responseJson.error).toBe('Validation error');
    });

    it('should return 400 if transfer type without toAccountId', async () => {
      mockRequest = {
        userId: 'test-user-id',
        body: {
          accountId: '550e8400-e29b-41d4-a716-446655440000',
          type: 'transfer',
          amountCents: 5000,
          currency: 'EUR',
          date: new Date().toISOString(),
        },
      };

      await transactionsController.create(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(400);
      // Zod validation may fail first or custom validation
      expect(['Validation error', 'Transfer requires toAccountId']).toContain(responseJson.error);
    });

    it('should successfully create an expense transaction', async () => {
      const mockTransaction = {
        id: 'new-tx-id',
        userId: 'test-user-id',
        accountId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'expense',
        amountCents: 5000,
        currency: 'EUR',
        date: new Date(),
        description: 'Groceries',
      };

      mockRequest = {
        userId: 'test-user-id',
        body: {
          accountId: '550e8400-e29b-41d4-a716-446655440000',
          type: 'expense',
          amountCents: 5000,
          currency: 'EUR',
          date: new Date().toISOString(),
          description: 'Groceries',
        },
      };

      const mockReturning = vi.fn().mockResolvedValueOnce([mockTransaction]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      vi.mocked(db.insert).mockReturnValueOnce({ values: mockValues } as any);

      await transactionsController.create(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(201);
      expect(responseJson.id).toBe('new-tx-id');
      expect(responseJson.type).toBe('expense');
      expect(responseJson.amountCents).toBe(5000);
    });

    it('should successfully create a transfer transaction', async () => {
      const mockTransaction = {
        id: 'transfer-tx-id',
        userId: 'test-user-id',
        accountId: '550e8400-e29b-41d4-a716-446655440001',
        toAccountId: '550e8400-e29b-41d4-a716-446655440002',
        type: 'transfer',
        amountCents: 10000,
        currency: 'EUR',
        date: new Date(),
      };

      mockRequest = {
        userId: 'test-user-id',
        body: {
          accountId: '550e8400-e29b-41d4-a716-446655440001',
          toAccountId: '550e8400-e29b-41d4-a716-446655440002',
          type: 'transfer',
          amountCents: 10000,
          currency: 'EUR',
          date: new Date().toISOString(),
        },
      };

      const mockReturning = vi.fn().mockResolvedValueOnce([mockTransaction]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      vi.mocked(db.insert).mockReturnValueOnce({ values: mockValues } as any);

      await transactionsController.create(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(201);
      expect(responseJson.type).toBe('transfer');
      expect(responseJson.toAccountId).toBe('550e8400-e29b-41d4-a716-446655440002');
    });
  });

  describe('update', () => {
    it('should return 404 if transaction not found', async () => {
      mockRequest = {
        userId: 'test-user-id',
        params: { id: 'nonexistent-tx-id' },
        body: { description: 'Updated' },
      };

      const mockReturning = vi.fn().mockResolvedValueOnce([]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.update).mockReturnValueOnce({ set: mockSet } as any);

      await transactionsController.update(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(404);
      expect(responseJson.error).toBe('Transaction not found');
    });

    it('should successfully update a transaction', async () => {
      const updatedTransaction = {
        id: 'tx-id',
        userId: 'test-user-id',
        description: 'Updated Description',
        amountCents: 7500,
        updatedAt: new Date(),
      };

      mockRequest = {
        userId: 'test-user-id',
        params: { id: 'tx-id' },
        body: { 
          description: 'Updated Description',
          amountCents: 7500,
        },
      };

      const mockReturning = vi.fn().mockResolvedValueOnce([updatedTransaction]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.update).mockReturnValueOnce({ set: mockSet } as any);

      await transactionsController.update(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(200);
      expect(responseJson.description).toBe('Updated Description');
      expect(responseJson.amountCents).toBe(7500);
    });
  });

  describe('delete', () => {
    it('should return 404 if transaction not found', async () => {
      mockRequest = {
        userId: 'test-user-id',
        params: { id: 'nonexistent-tx-id' },
      };

      vi.mocked(db.query.transactions.findFirst).mockResolvedValueOnce(null as any);

      await transactionsController.delete(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(404);
      expect(responseJson.error).toBe('Transaction not found');
    });

    it('should successfully delete a transaction', async () => {
      mockRequest = {
        userId: 'test-user-id',
        params: { id: 'tx-id' },
      };

      vi.mocked(db.query.transactions.findFirst).mockResolvedValueOnce({
        id: 'tx-id',
        description: 'Test Transaction',
        amountCents: 5000,
      } as any);

      const mockWhere = vi.fn().mockResolvedValueOnce([]);
      vi.mocked(db.delete).mockReturnValueOnce({ where: mockWhere } as any);

      await transactionsController.delete(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toBe(204);
    });
  });
});
