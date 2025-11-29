// @ts-nocheck
import { Request, Response } from 'express';
import { db } from '../db.js';
import { recurringTransactions, transactions, accounts, categories } from '../db/schema.js';
import { eq, and, lte, desc, asc } from 'drizzle-orm';
import { addDays, addWeeks, addMonths, addYears, startOfDay, isBefore, isAfter } from 'date-fns';

/**
 * Get all recurring transactions for the user
 */
export async function getRecurringTransactions(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    
    const recurring = await db
      .select({
        id: recurringTransactions.id,
        accountId: recurringTransactions.accountId,
        type: recurringTransactions.type,
        amountCents: recurringTransactions.amountCents,
        currency: recurringTransactions.currency,
        description: recurringTransactions.description,
        descriptionTranslations: recurringTransactions.descriptionTranslations,
        categoryId: recurringTransactions.categoryId,
        toAccountId: recurringTransactions.toAccountId,
        frequency: recurringTransactions.frequency,
        intervalCount: recurringTransactions.intervalCount,
        dayOfMonth: recurringTransactions.dayOfMonth,
        dayOfWeek: recurringTransactions.dayOfWeek,
        startDate: recurringTransactions.startDate,
        endDate: recurringTransactions.endDate,
        nextOccurrence: recurringTransactions.nextOccurrence,
        lastProcessed: recurringTransactions.lastProcessed,
        isActive: recurringTransactions.isActive,
        autoPost: recurringTransactions.autoPost,
        reminderDays: recurringTransactions.reminderDays,
        totalOccurrences: recurringTransactions.totalOccurrences,
        createdAt: recurringTransactions.createdAt,
        updatedAt: recurringTransactions.updatedAt,
        // Join account name
        accountName: accounts.name,
        // Join category name
        categoryName: categories.name,
      })
      .from(recurringTransactions)
      .leftJoin(accounts, eq(recurringTransactions.accountId, accounts.id))
      .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id))
      .where(eq(recurringTransactions.userId, userId))
      .orderBy(asc(recurringTransactions.nextOccurrence));

    res.json(recurring);
  } catch (error: any) {
    console.error('Error fetching recurring transactions:', error);
    res.status(500).json({ error: 'Failed to fetch recurring transactions' });
  }
}

/**
 * Get a single recurring transaction
 */
export async function getRecurringTransaction(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const [recurring] = await db
      .select()
      .from(recurringTransactions)
      .where(and(
        eq(recurringTransactions.id, id),
        eq(recurringTransactions.userId, userId)
      ));

    if (!recurring) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    res.json(recurring);
  } catch (error: any) {
    console.error('Error fetching recurring transaction:', error);
    res.status(500).json({ error: 'Failed to fetch recurring transaction' });
  }
}

/**
 * Create a new recurring transaction
 */
export async function createRecurringTransaction(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const {
      accountId,
      type,
      amountCents,
      currency,
      description,
      descriptionTranslations,
      categoryId,
      toAccountId,
      frequency,
      intervalCount = 1,
      dayOfMonth,
      dayOfWeek,
      startDate,
      endDate,
      autoPost = true,
      reminderDays = 3,
    } = req.body;

    // Validate required fields
    if (!accountId || !type || !amountCents || !currency || !frequency || !startDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: accountId, type, amountCents, currency, frequency, startDate' 
      });
    }

    // Validate frequency
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
      return res.status(400).json({ error: 'Invalid frequency. Must be: daily, weekly, monthly, yearly' });
    }

    // Verify account belongs to user
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Calculate next occurrence
    const nextOccurrence = calculateNextOccurrence(
      new Date(startDate),
      frequency,
      intervalCount,
      dayOfMonth,
      dayOfWeek
    );

    const [created] = await db
      .insert(recurringTransactions)
      .values({
        userId,
        accountId,
        type,
        amountCents,
        currency,
        description,
        descriptionTranslations,
        categoryId: categoryId || null,
        toAccountId: toAccountId || null,
        frequency,
        intervalCount,
        dayOfMonth: dayOfMonth || null,
        dayOfWeek: dayOfWeek || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextOccurrence,
        autoPost,
        reminderDays,
      })
      .returning();

    console.log('✅ Created recurring transaction:', created.id);
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating recurring transaction:', error);
    res.status(500).json({ error: 'Failed to create recurring transaction' });
  }
}

/**
 * Update a recurring transaction
 */
export async function updateRecurringTransaction(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const updates = req.body;

    // Check if exists
    const [existing] = await db
      .select()
      .from(recurringTransactions)
      .where(and(
        eq(recurringTransactions.id, id),
        eq(recurringTransactions.userId, userId)
      ));

    if (!existing) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    // Recalculate next occurrence if schedule changed
    if (updates.frequency || updates.intervalCount || updates.dayOfMonth || updates.dayOfWeek || updates.startDate) {
      const frequency = updates.frequency || existing.frequency;
      const intervalCount = updates.intervalCount || existing.intervalCount;
      const dayOfMonth = updates.dayOfMonth !== undefined ? updates.dayOfMonth : existing.dayOfMonth;
      const dayOfWeek = updates.dayOfWeek !== undefined ? updates.dayOfWeek : existing.dayOfWeek;
      const startDate = updates.startDate ? new Date(updates.startDate) : existing.startDate;

      updates.nextOccurrence = calculateNextOccurrence(
        startDate,
        frequency,
        intervalCount,
        dayOfMonth,
        dayOfWeek
      );
    }

    const [updated] = await db
      .update(recurringTransactions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(recurringTransactions.id, id),
        eq(recurringTransactions.userId, userId)
      ))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating recurring transaction:', error);
    res.status(500).json({ error: 'Failed to update recurring transaction' });
  }
}

/**
 * Delete a recurring transaction
 */
export async function deleteRecurringTransaction(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const [deleted] = await db
      .delete(recurringTransactions)
      .where(and(
        eq(recurringTransactions.id, id),
        eq(recurringTransactions.userId, userId)
      ))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    res.json({ message: 'Recurring transaction deleted', id: deleted.id });
  } catch (error: any) {
    console.error('Error deleting recurring transaction:', error);
    res.status(500).json({ error: 'Failed to delete recurring transaction' });
  }
}

/**
 * Toggle active status
 */
export async function toggleRecurringActive(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(recurringTransactions)
      .where(and(
        eq(recurringTransactions.id, id),
        eq(recurringTransactions.userId, userId)
      ));

    if (!existing) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    const [updated] = await db
      .update(recurringTransactions)
      .set({
        isActive: !existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(recurringTransactions.id, id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Error toggling recurring status:', error);
    res.status(500).json({ error: 'Failed to toggle status' });
  }
}

/**
 * Process due recurring transactions (called by cron job)
 */
export async function processDueRecurring(req: Request, res: Response) {
  try {
    const now = new Date();
    
    // Find all active recurring transactions that are due
    const dueTransactions = await db
      .select()
      .from(recurringTransactions)
      .where(and(
        eq(recurringTransactions.isActive, true),
        eq(recurringTransactions.autoPost, true),
        lte(recurringTransactions.nextOccurrence, now)
      ));

    const results = {
      processed: 0,
      created: [] as string[],
      errors: [] as string[],
    };

    for (const recurring of dueTransactions) {
      try {
        // Check if end date passed
        if (recurring.endDate && isAfter(now, recurring.endDate)) {
          // Deactivate this recurring transaction
          await db
            .update(recurringTransactions)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(recurringTransactions.id, recurring.id));
          continue;
        }

        // Create the actual transaction
        const [newTransaction] = await db
          .insert(transactions)
          .values({
            userId: recurring.userId,
            accountId: recurring.accountId,
            type: recurring.type,
            amountCents: recurring.amountCents,
            currency: recurring.currency,
            fxRate: '1.0',
            date: recurring.nextOccurrence,
            description: recurring.description,
            descriptionTranslations: recurring.descriptionTranslations as any,
            categoryId: recurring.categoryId,
            toAccountId: recurring.toAccountId,
            tags: ['recurring'],
          })
          .returning();

        // Calculate next occurrence
        const nextOccurrence = calculateNextOccurrence(
          recurring.nextOccurrence,
          recurring.frequency,
          recurring.intervalCount,
          recurring.dayOfMonth,
          recurring.dayOfWeek,
          true // skip to next
        );

        // Update recurring transaction
        await db
          .update(recurringTransactions)
          .set({
            nextOccurrence,
            lastProcessed: now,
            totalOccurrences: recurring.totalOccurrences + 1,
            updatedAt: new Date(),
          })
          .where(eq(recurringTransactions.id, recurring.id));

        results.processed++;
        results.created.push(newTransaction.id);
        console.log(`✅ Created transaction from recurring ${recurring.id}`);
      } catch (err: any) {
        console.error(`Error processing recurring ${recurring.id}:`, err);
        results.errors.push(`${recurring.id}: ${err.message}`);
      }
    }

    res.json(results);
  } catch (error: any) {
    console.error('Error processing recurring transactions:', error);
    res.status(500).json({ error: 'Failed to process recurring transactions' });
  }
}

/**
 * Get upcoming recurring transactions
 */
export async function getUpcomingRecurring(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const days = parseInt(req.query.days as string) || 30;

    const futureDate = addDays(new Date(), days);

    const upcoming = await db
      .select({
        id: recurringTransactions.id,
        description: recurringTransactions.description,
        amountCents: recurringTransactions.amountCents,
        currency: recurringTransactions.currency,
        type: recurringTransactions.type,
        nextOccurrence: recurringTransactions.nextOccurrence,
        frequency: recurringTransactions.frequency,
        accountName: accounts.name,
        categoryName: categories.name,
      })
      .from(recurringTransactions)
      .leftJoin(accounts, eq(recurringTransactions.accountId, accounts.id))
      .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id))
      .where(and(
        eq(recurringTransactions.userId, userId),
        eq(recurringTransactions.isActive, true),
        lte(recurringTransactions.nextOccurrence, futureDate)
      ))
      .orderBy(asc(recurringTransactions.nextOccurrence));

    res.json(upcoming);
  } catch (error: any) {
    console.error('Error fetching upcoming recurring:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming transactions' });
  }
}

/**
 * Calculate the next occurrence date
 */
function calculateNextOccurrence(
  fromDate: Date,
  frequency: string,
  intervalCount: number,
  dayOfMonth: number | null,
  dayOfWeek: number | null,
  skipCurrent: boolean = false
): Date {
  let nextDate = startOfDay(fromDate);

  // If skipCurrent, we need to advance by at least one interval
  if (skipCurrent) {
    switch (frequency) {
      case 'daily':
        nextDate = addDays(nextDate, intervalCount);
        break;
      case 'weekly':
        nextDate = addWeeks(nextDate, intervalCount);
        break;
      case 'monthly':
        nextDate = addMonths(nextDate, intervalCount);
        break;
      case 'yearly':
        nextDate = addYears(nextDate, intervalCount);
        break;
    }
  }

  // Adjust for specific day of week (for weekly)
  if (frequency === 'weekly' && dayOfWeek !== null) {
    const currentDay = nextDate.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
    if (daysUntilTarget > 0 || (daysUntilTarget === 0 && skipCurrent)) {
      nextDate = addDays(nextDate, daysUntilTarget || 7);
    }
  }

  // Adjust for specific day of month (for monthly/yearly)
  if ((frequency === 'monthly' || frequency === 'yearly') && dayOfMonth !== null) {
    const targetDay = Math.min(dayOfMonth, getDaysInMonth(nextDate));
    nextDate.setDate(targetDay);
  }

  // Make sure we don't return a past date
  const now = startOfDay(new Date());
  while (isBefore(nextDate, now)) {
    switch (frequency) {
      case 'daily':
        nextDate = addDays(nextDate, intervalCount);
        break;
      case 'weekly':
        nextDate = addWeeks(nextDate, intervalCount);
        break;
      case 'monthly':
        nextDate = addMonths(nextDate, intervalCount);
        break;
      case 'yearly':
        nextDate = addYears(nextDate, intervalCount);
        break;
    }
  }

  return nextDate;
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
