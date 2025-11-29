// @ts-nocheck
import { db } from '../db.js';
import { recurringTransactions, transactions, budgets, priceAlerts, notifications, pushTokens } from '../db/schema.js';
import { eq, and, lte, gte, sql, isNull } from 'drizzle-orm';
import { sendNotification } from '../controllers/notifications.controller.js';

/**
 * Process recurring transactions that are due
 * Should be called daily via cron job
 */
export const processRecurringTransactions = async (): Promise<{ processed: number; errors: number }> => {
  console.log('[CRON] Processing recurring transactions...');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let processed = 0;
  let errors = 0;

  try {
    // Get all active recurring transactions due today or earlier
    const dueRecurring = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.isActive, true),
          eq(recurringTransactions.autoPost, true),
          lte(recurringTransactions.nextOccurrence, today)
        )
      );

    console.log(`[CRON] Found ${dueRecurring.length} recurring transactions to process`);

    for (const recurring of dueRecurring) {
      try {
        // Check if end date has passed
        if (recurring.endDate && new Date(recurring.endDate) < today) {
          // Deactivate the recurring transaction
          await db
            .update(recurringTransactions)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(recurringTransactions.id, recurring.id));
          continue;
        }

        // Create the actual transaction
        await db.insert(transactions).values({
          userId: recurring.userId,
          accountId: recurring.accountId,
          type: recurring.type,
          amountCents: recurring.amountCents,
          currency: recurring.currency,
          date: new Date(),
          description: recurring.description || 'Recurring Transaction',
          categoryId: recurring.categoryId,
          toAccountId: recurring.toAccountId,
        });

        // Calculate next occurrence
        const nextOccurrence = calculateNextOccurrence(
          recurring.nextOccurrence!,
          recurring.frequency,
          recurring.intervalCount || 1,
          recurring.dayOfMonth,
          recurring.dayOfWeek
        );

        // Update recurring transaction
        await db
          .update(recurringTransactions)
          .set({
            lastProcessed: new Date(),
            nextOccurrence,
            totalOccurrences: (recurring.totalOccurrences || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(recurringTransactions.id, recurring.id));

        processed++;
      } catch (error) {
        console.error(`[CRON] Error processing recurring transaction ${recurring.id}:`, error);
        errors++;
      }
    }
  } catch (error) {
    console.error('[CRON] Error in processRecurringTransactions:', error);
  }

  console.log(`[CRON] Recurring transactions processed: ${processed}, errors: ${errors}`);
  return { processed, errors };
};

/**
 * Send reminders for upcoming recurring transactions
 */
export const sendRecurringReminders = async (): Promise<number> => {
  console.log('[CRON] Sending recurring transaction reminders...');

  let sent = 0;

  try {
    // Get recurring transactions with reminders due in next X days
    const upcoming = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.isActive, true),
          eq(recurringTransactions.autoPost, false) // Manual posting required
        )
      );

    for (const recurring of upcoming) {
      const reminderDays = recurring.reminderDays || 3;
      const nextDate = new Date(recurring.nextOccurrence!);
      const reminderDate = new Date(nextDate);
      reminderDate.setDate(reminderDate.getDate() - reminderDays);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (reminderDate <= today && today < nextDate) {
        const amount = (recurring.amountCents / 100).toFixed(2);
        await sendNotification(
          recurring.userId,
          'recurring_reminder',
          'Upcoming Transaction',
          `"${recurring.description}" (${recurring.currency} ${amount}) is due in ${Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days`,
          { recurringId: recurring.id }
        );
        sent++;
      }
    }
  } catch (error) {
    console.error('[CRON] Error sending recurring reminders:', error);
  }

  console.log(`[CRON] Recurring reminders sent: ${sent}`);
  return sent;
};

/**
 * Check budgets and send warnings
 */
export const checkBudgetWarnings = async (): Promise<number> => {
  console.log('[CRON] Checking budget warnings...');

  let warnings = 0;

  try {
    const allBudgets = await db.select().from(budgets);

    for (const budget of allBudgets) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      // Calculate spending for this budget
      const spendingResult = await db.execute(sql`
        SELECT COALESCE(SUM(amount_cents), 0) as total
        FROM transactions
        WHERE user_id = ${budget.userId}
          AND type = 'expense'
          AND date >= ${startOfMonth.toISOString()}
          AND date < ${endOfMonth.toISOString()}
          ${budget.categoryId ? sql`AND category_id = ${budget.categoryId}` : sql``}
          AND deleted_at IS NULL
      `);

      const spending = Number(spendingResult.rows?.[0]?.total || 0);
      const percentage = (spending / budget.amountCents) * 100;

      // Send warning at 80% and 100%
      if (percentage >= 80 && percentage < 100) {
        const budgetName = budget.name || 'Budget';
        await sendNotification(
          budget.userId,
          'budget_warning',
          'Budget Warning ⚠️',
          `You've used ${percentage.toFixed(0)}% of your ${budgetName} budget`,
          { budgetId: budget.id, percentage }
        );
        warnings++;
      } else if (percentage >= 100) {
        const budgetName = budget.name || 'Budget';
        await sendNotification(
          budget.userId,
          'budget_warning',
          'Budget Exceeded 🚨',
          `You've exceeded your ${budgetName} budget by ${(percentage - 100).toFixed(0)}%`,
          { budgetId: budget.id, percentage }
        );
        warnings++;
      }
    }
  } catch (error) {
    console.error('[CRON] Error checking budget warnings:', error);
  }

  console.log(`[CRON] Budget warnings sent: ${warnings}`);
  return warnings;
};

/**
 * Check and trigger price alerts
 */
export const checkPriceAlerts = async (currentPrices: Record<string, number>): Promise<number> => {
  console.log('[CRON] Checking price alerts...');

  let triggered = 0;

  try {
    const activeAlerts = await db
      .select()
      .from(priceAlerts)
      .where(eq(priceAlerts.isActive, true));

    for (const alert of activeAlerts) {
      const currentPrice = currentPrices[alert.asset];
      if (!currentPrice) continue;

      let shouldTrigger = false;
      if (alert.alertType === 'above' && currentPrice >= Number(alert.targetPrice)) {
        shouldTrigger = true;
      } else if (alert.alertType === 'below' && currentPrice <= Number(alert.targetPrice)) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        await sendNotification(
          alert.userId,
          'price_alert',
          `Price Alert: ${alert.asset}`,
          `${alert.asset} is now ${alert.alertType} ${Number(alert.targetPrice).toFixed(2)} at $${currentPrice.toFixed(2)}`,
          { alertId: alert.id, asset: alert.asset, price: currentPrice }
        );

        // Deactivate alert after triggering
        await db
          .update(priceAlerts)
          .set({
            isActive: false,
            triggeredAt: new Date(),
            notificationSent: true,
            currentPrice: currentPrice.toString(),
            updatedAt: new Date(),
          })
          .where(eq(priceAlerts.id, alert.id));

        triggered++;
      }
    }
  } catch (error) {
    console.error('[CRON] Error checking price alerts:', error);
  }

  console.log(`[CRON] Price alerts triggered: ${triggered}`);
  return triggered;
};

/**
 * Calculate next occurrence date based on frequency
 */
function calculateNextOccurrence(
  currentDate: Date,
  frequency: string,
  interval: number,
  dayOfMonth?: number | null,
  dayOfWeek?: number | null
): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7 * interval);
      if (dayOfWeek !== null && dayOfWeek !== undefined) {
        // Adjust to specific day of week
        while (next.getDay() !== dayOfWeek) {
          next.setDate(next.getDate() + 1);
        }
      }
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + interval);
      if (dayOfMonth !== null && dayOfMonth !== undefined) {
        // Set specific day of month
        const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(dayOfMonth, lastDay));
      }
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }

  return next;
}

/**
 * Run all scheduled tasks
 * This should be called by an external cron job
 */
export const runScheduledTasks = async (): Promise<void> => {
  console.log('[CRON] Starting scheduled tasks at', new Date().toISOString());

  try {
    // Process recurring transactions
    await processRecurringTransactions();

    // Send reminders
    await sendRecurringReminders();

    // Check budgets (once per day)
    await checkBudgetWarnings();

    console.log('[CRON] All scheduled tasks completed');
  } catch (error) {
    console.error('[CRON] Error running scheduled tasks:', error);
  }
};
