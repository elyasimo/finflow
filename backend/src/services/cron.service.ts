// @ts-nocheck
import { db } from '../db.js';
import { recurringTransactions, transactions, budgets, priceAlerts, notifications, pushTokens, users, categories } from '../db/schema.js';
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

        // Send push notification for auto-posted transaction
        const amount = (recurring.amountCents / 100).toFixed(2);
        const typeEmoji = recurring.type === 'income' ? '💰' : '💸';
        const typeText = recurring.type === 'income' ? 'Einnahme' : 'Ausgabe';
        
        await sendNotification(
          recurring.userId,
          'recurring_posted',
          `${typeEmoji} Wiederkehrende ${typeText} gebucht`,
          `"${recurring.description}" - ${recurring.currency} ${amount} wurde automatisch gebucht.`,
          { recurringId: recurring.id, amount, type: recurring.type }
        );

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
 * Send weekly financial summary report
 * Should be called on Sundays/Mondays
 */
export const sendWeeklyReports = async (): Promise<number> => {
  console.log('[CRON] Sending weekly reports...');

  let sent = 0;

  try {
    // Get all users
    const allUsers = await db.select({ id: users.id }).from(users);

    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const user of allUsers) {
      try {
        // Calculate weekly spending
        const spendingResult = await db.execute(sql`
          SELECT 
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_cents ELSE 0 END), 0) as expenses,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount_cents ELSE 0 END), 0) as income,
            COUNT(*) as transaction_count
          FROM transactions
          WHERE user_id = ${user.id}
            AND date >= ${oneWeekAgo.toISOString()}
            AND date <= ${today.toISOString()}
            AND deleted_at IS NULL
        `);

        const row = spendingResult.rows?.[0] as any;
        if (!row) continue;

        const expenses = Number(row.expenses || 0) / 100;
        const income = Number(row.income || 0) / 100;
        const transactionCount = Number(row.transaction_count || 0);

        // Only send if there was activity
        if (transactionCount > 0) {
          const balance = income - expenses;
          const balanceEmoji = balance >= 0 ? '📈' : '📉';
          const balanceText = balance >= 0 ? `+${balance.toFixed(2)}` : balance.toFixed(2);

          await sendNotification(
            user.id,
            'weekly_report',
            '📊 Wochenbericht',
            `Diese Woche: ${transactionCount} Transaktionen\nEinnahmen: +${income.toFixed(2)} CHF\nAusgaben: -${expenses.toFixed(2)} CHF\n${balanceEmoji} Bilanz: ${balanceText} CHF`,
            { 
              income: income.toString(), 
              expenses: expenses.toString(), 
              transactionCount: transactionCount.toString(),
              balance: balance.toString()
            }
          );
          sent++;
        }
      } catch (error) {
        console.error(`[CRON] Error sending weekly report for user ${user.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[CRON] Error in sendWeeklyReports:', error);
  }

  console.log(`[CRON] Weekly reports sent: ${sent}`);
  return sent;
};

/**
 * Check budget after a new transaction
 * Called after transaction creation to send real-time warnings
 */
export const checkBudgetAfterTransaction = async (
  userId: string,
  categoryId: string | null,
  amountCents: number
): Promise<void> => {
  if (!categoryId) return;

  try {
    // Find budget for this category
    const [budget] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.categoryId, categoryId)));

    if (!budget) return;

    // Calculate current month spending
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const spendingResult = await db.execute(sql`
      SELECT COALESCE(SUM(amount_cents), 0) as total
      FROM transactions
      WHERE user_id = ${userId}
        AND type = 'expense'
        AND date >= ${startOfMonth.toISOString()}
        AND date < ${endOfMonth.toISOString()}
        AND category_id = ${categoryId}
        AND deleted_at IS NULL
    `);

    const spending = Number(spendingResult.rows?.[0]?.total || 0);
    const percentage = (spending / budget.amountCents) * 100;

    // Get category name
    const [category] = await db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.id, categoryId));
    
    const categoryName = category?.name || budget.name || 'Budget';

    // Send warning at key thresholds (80%, 90%, 100%)
    if (percentage >= 100) {
      await sendNotification(
        userId,
        'budget_exceeded',
        '🚨 Budget überschritten!',
        `Dein Budget für "${categoryName}" wurde überschritten! ${percentage.toFixed(0)}% erreicht.`,
        { budgetId: budget.id, categoryId, percentage: percentage.toString() }
      );
    } else if (percentage >= 90) {
      await sendNotification(
        userId,
        'budget_warning_90',
        '⚠️ Budget fast aufgebraucht!',
        `Du hast bereits ${percentage.toFixed(0)}% deines Budgets für "${categoryName}" ausgegeben.`,
        { budgetId: budget.id, categoryId, percentage: percentage.toString() }
      );
    } else if (percentage >= 80) {
      await sendNotification(
        userId,
        'budget_warning_80',
        '📊 Budget-Warnung',
        `Du hast ${percentage.toFixed(0)}% deines Budgets für "${categoryName}" erreicht.`,
        { budgetId: budget.id, categoryId, percentage: percentage.toString() }
      );
    }
  } catch (error) {
    console.error('[BUDGET] Error checking budget after transaction:', error);
  }
};

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

    // Send weekly reports on Sunday
    const today = new Date();
    if (today.getDay() === 0) { // Sunday
      await sendWeeklyReports();
    }

    console.log('[CRON] All scheduled tasks completed');
  } catch (error) {
    console.error('[CRON] Error running scheduled tasks:', error);
  }
};
