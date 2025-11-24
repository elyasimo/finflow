import { Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { budgets, transactions, categories, users } from '../../drizzle/schema.js';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import type { AuthRequest } from '../middleware/auth.js';
import { translationQueue } from '../services/auto-translate.service.js';

const createBudgetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default('EUR'),
  categoryId: z.string().uuid().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  rollover: z.boolean().optional().default(false),
});

const updateBudgetSchema = createBudgetSchema.partial();

export class BudgetsController {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await db.query.budgets.findMany({
        where: eq(budgets.userId, req.userId!),
        with: {
          // category: true, // Enable if you want category details
        },
        orderBy: (budgets, { desc }) => [desc(budgets.createdAt)],
      });

      // Transform to frontend format
      const transformedBudgets = result.map(budget => ({
        id: budget.id,
        name: budget.name || `${budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget`,
        nameTranslations: budget.nameTranslations,
        amount: budget.amountCents / 100,
        categoryId: budget.categoryId,
        period: budget.period,
        currency: budget.currency,
        rollover: budget.rollover,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        // Use stored dates or calculate based on period
        startDate: budget.startDate?.toISOString() || this.getStartDate(budget.period),
        endDate: budget.endDate?.toISOString() || this.getEndDate(budget.period),
      }));

      res.json(transformedBudgets);
    } catch (error) {
      console.error('List budgets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const budget = await db.query.budgets.findFirst({
        where: and(eq(budgets.id, id), eq(budgets.userId, req.userId!)),
      });

      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      res.json({
        id: budget.id,
        name: budget.name || `${budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget`,
        nameTranslations: budget.nameTranslations,
        amount: budget.amountCents / 100,
        categoryId: budget.categoryId,
        period: budget.period,
        currency: budget.currency,
        rollover: budget.rollover,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        startDate: budget.startDate?.toISOString() || this.getStartDate(budget.period),
        endDate: budget.endDate?.toISOString() || this.getEndDate(budget.period),
      });
    } catch (error) {
      console.error('Get budget error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getBudgetUsage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const budget = await db.query.budgets.findFirst({
        where: and(eq(budgets.id, id), eq(budgets.userId, req.userId!)),
      });

      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      // Use stored dates or calculate based on period
      const startDate = budget.startDate || new Date(this.getStartDate(budget.period));
      const endDate = budget.endDate || new Date(this.getEndDate(budget.period));

      const spentResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, req.userId!),
            eq(transactions.type, 'expense'),
            budget.categoryId ? eq(transactions.categoryId, budget.categoryId) : undefined,
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        );

      const spentAmount = (spentResult[0]?.total || 0) / 100;
      const budgetAmount = budget.amountCents / 100;

      res.json({
        budgetId: budget.id,
        budgetName: budget.name || budget.period,
        budgetAmount,
        spentAmount,
        remainingAmount: budgetAmount - spentAmount,
        startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
        endDate: endDate instanceof Date ? endDate.toISOString() : endDate,
        percentage: budgetAmount > 0 ? Math.min(100, (spentAmount / budgetAmount) * 100) : 0,
      });
    } catch (error) {
      console.error('Get budget usage error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = createBudgetSchema.parse(req.body);

      const [budget] = await db
        .insert(budgets)
        .values({
          name: data.name,
          amountCents: data.amountCents,
          currency: data.currency,
          categoryId: data.categoryId,
          period: data.period,
          rollover: data.rollover,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          userId: req.userId!,
        })
        .returning();

      // Auto-translate budget name in background
      if (budget.name) {
        translationQueue.add('budgets', budget.id, 'name', budget.name);
      }

      res.status(201).json({
        id: budget.id,
        name: budget.name || `${budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget`,
        nameTranslations: budget.nameTranslations,
        amount: budget.amountCents / 100,
        categoryId: budget.categoryId,
        period: budget.period,
        currency: budget.currency,
        rollover: budget.rollover,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        startDate: budget.startDate?.toISOString() || this.getStartDate(budget.period),
        endDate: budget.endDate?.toISOString() || this.getEndDate(budget.period),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      console.error('Create budget error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateBudgetSchema.parse(req.body);

      // Convert ISO string dates to Date objects for Drizzle
      const updateData: any = { ...data, updatedAt: new Date() };
      if (data.startDate) updateData.startDate = new Date(data.startDate);
      if (data.endDate) updateData.endDate = new Date(data.endDate);

      const [budget] = await db
        .update(budgets)
        .set(updateData)
        .where(and(eq(budgets.id, id), eq(budgets.userId, req.userId!)))
        .returning();

      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      // Auto-translate budget name if changed
      if (data.name && budget.name) {
        translationQueue.add('budgets', budget.id, 'name', budget.name);
      }

      res.json({
        id: budget.id,
        name: budget.name || `${budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget`,
        nameTranslations: budget.nameTranslations,
        amount: budget.amountCents / 100,
        categoryId: budget.categoryId,
        period: budget.period,
        currency: budget.currency,
        rollover: budget.rollover,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        startDate: this.getStartDate(budget.period),
        endDate: this.getEndDate(budget.period),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      console.error('Update budget error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const [budget] = await db
        .delete(budgets)
        .where(and(eq(budgets.id, id), eq(budgets.userId, req.userId!)))
        .returning();

      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete budget error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Helper methods for date calculations
  private getStartDate(period: string): string {
    const now = new Date();

    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();

      case 'weekly':
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday is start of week
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset, 0, 0, 0).toISOString();

      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      case 'quarterly':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const quarterStartMonth = currentQuarter * 3;
        return new Date(now.getFullYear(), quarterStartMonth, 1).toISOString();

      case 'yearly':
        return new Date(now.getFullYear(), 0, 1).toISOString();

      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  }

  private getEndDate(period: string): string {
    const now = new Date();

    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      case 'weekly':
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const sundayOffset = mondayOffset + 6;
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + sundayOffset, 23, 59, 59).toISOString();

      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      case 'quarterly':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const quarterEndMonth = currentQuarter * 3 + 2;
        return new Date(now.getFullYear(), quarterEndMonth + 1, 0, 23, 59, 59).toISOString();

      case 'yearly':
        return new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();

      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    }
  }

  // Get budget suggestions based on recent spending patterns
  async getSuggestions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;

      // Get all existing budgets
      const existingBudgets = await db.query.budgets.findMany({
        where: eq(budgets.userId, userId)
      });

      // Get last 3 months of expense transactions
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentExpenses = await db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, threeMonthsAgo)
        ),
        with: {
          category: true
        }
      });

      // Group spending by category
      const categorySpending = new Map<string, { categoryId: string; categoryName: string; totalAmount: number; count: number; avgMonthly: number }>();

      for (const tx of recentExpenses) {
        if (tx.categoryId) {
          const existing = categorySpending.get(tx.categoryId);
          const amount = tx.amountCents / 100;
          
          if (existing) {
            existing.totalAmount += amount;
            existing.count += 1;
          } else {
            const category = await db.query.categories.findFirst({
              where: eq(categories.id, tx.categoryId)
            });

            if (category) {
              categorySpending.set(tx.categoryId, {
                categoryId: tx.categoryId,
                categoryName: category.name,
                totalAmount: amount,
                count: 1,
                avgMonthly: 0
              });
            }
          }
        }
      }

      // Calculate average monthly spending
      const monthsAnalyzed = 3;
      for (const data of categorySpending.values()) {
        data.avgMonthly = Math.ceil(data.totalAmount / monthsAnalyzed);
      }

      // Filter out categories that already have budgets
      const suggestions = [];
      for (const [categoryId, data] of categorySpending.entries()) {
        const hasBudget = existingBudgets.some(b => b.categoryId === categoryId);
        
        if (!hasBudget && data.avgMonthly > 0) {
          suggestions.push({
            categoryId: data.categoryId,
            categoryName: data.categoryName,
            suggestedAmount: Math.ceil(data.avgMonthly * 1.1), // Add 10% buffer
            avgMonthlySpending: data.avgMonthly,
            totalSpent: data.totalAmount,
            transactionCount: data.count,
            period: 'monthly',
            currency: 'CHF' // Default currency, should be fetched from user preferences
          });
        }
      }

      // Sort by highest spending first
      suggestions.sort((a, b) => b.avgMonthlySpending - a.avgMonthlySpending);

      res.json({
        suggestions,
        analyzedPeriod: `Last ${monthsAnalyzed} months`,
        message: suggestions.length > 0 
          ? `Found ${suggestions.length} category/categories without budgets` 
          : 'All spending categories have budgets'
      });
    } catch (error) {
      console.error('Get budget suggestions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
