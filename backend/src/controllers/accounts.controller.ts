import { Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { accounts, transactions } from '../../drizzle/schema.js';
import { eq, and, isNull, sql } from 'drizzle-orm';
import type { AuthRequest } from '../middleware/auth.js';
import { translationQueue } from '../services/auto-translate.service.js';

const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['cash', 'bank', 'creditCard', 'investment', 'crypto', 'savings']),
  currency: z.string().length(3),
  openingBalanceCents: z.number().int().optional().default(0),
  color: z.string().optional(),
});

const updateAccountSchema = createAccountSchema.partial();

export class AccountsController {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userAccounts = await db.query.accounts.findMany({
        where: and(
          eq(accounts.userId, req.userId!),
          eq(accounts.archived, false)
        ),
        orderBy: (accounts, { asc }) => [asc(accounts.createdAt)],
      });

      // Calculate current balance for each account
      const accountsWithBalance = await Promise.all(
        userAccounts.map(async (account) => {
          const result = await db
            .select({
              total: sql<number>`
                COALESCE(SUM(
                  CASE
                    WHEN ${transactions.type} = 'income' THEN ${transactions.amountCents}
                    WHEN ${transactions.type} = 'expense' THEN -${transactions.amountCents}
                    WHEN ${transactions.type} = 'transfer' AND ${transactions.accountId} = ${account.id} THEN -${transactions.amountCents}
                    WHEN ${transactions.type} = 'transfer' AND ${transactions.toAccountId} = ${account.id} THEN ${transactions.amountCents}
                    ELSE 0
                  END
                ), 0)::bigint
              `,
            })
            .from(transactions)
            .where(
              and(
                eq(transactions.userId, req.userId!),
                sql`(${transactions.accountId} = ${account.id} OR ${transactions.toAccountId} = ${account.id})`,
                isNull(transactions.deletedAt),
              ),
            );

          // Ensure both values are numbers before adding
          const transactionTotal = Number(result[0]?.total || 0);
          const openingBalance = Number(account.openingBalanceCents || 0);
          
          // For bank accounts: balance = transactions only (opening balance is always 0)
          // For other accounts (savings, cash, investment): balance = opening balance + transactions
          const currentBalanceCents = account.type === 'bank' 
            ? transactionTotal 
            : openingBalance + transactionTotal;

          return {
            ...account,
            currentBalanceCents,
          };
        }),
      );

      console.log('📊 Accounts API Response:', JSON.stringify(accountsWithBalance, null, 2));
      res.json(accountsWithBalance);
    } catch (error) {
      console.error('List accounts error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 CREATE ACCOUNT - Request body:', JSON.stringify(req.body, null, 2));
      const data = createAccountSchema.parse(req.body);
      console.log('✅ CREATE ACCOUNT - Validated data:', JSON.stringify(data, null, 2));

      const [account] = await db
        .insert(accounts)
        .values({
          ...data,
          userId: req.userId!,
        })
        .returning();

      // Auto-translate account name in background
      if (account.name) {
        translationQueue.add('accounts', account.id, 'name', account.name);
      }

      // Create opening balance transaction if opening balance > 0
      // Use account creation date so it appears in the correct month
      // ONLY for bank accounts (other accounts keep opening balance in the account record)
      if (account.openingBalanceCents && account.openingBalanceCents > 0 && account.type === 'bank') {
        try {
          await db.insert(transactions).values({
            userId: req.userId!,
            accountId: account.id,
            type: 'income',
            amountCents: account.openingBalanceCents,
            currency: account.currency,
            date: account.createdAt, // Use account creation date!
            description: `Anfangsbestand / Opening balance`,
            categoryId: null,
            notes: 'Automatically created from account opening balance',
            attachmentRefs: [],
            tags: [],
          });
          
          // Set opening balance to 0 for bank accounts to avoid double counting
          await db
            .update(accounts)
            .set({ openingBalanceCents: 0 })
            .where(eq(accounts.id, account.id));
            
          console.log(`✅ Created opening balance transaction for bank account: ${account.openingBalanceCents / 100} ${account.currency} on ${account.createdAt}`);
        } catch (txError) {
          console.error('Failed to create opening balance transaction:', txError);
          // Don't fail the account creation if transaction fails
        }
      } else if (account.openingBalanceCents && account.openingBalanceCents > 0) {
        console.log(`✅ Kept opening balance in account record for ${account.type}: ${account.openingBalanceCents / 100} ${account.currency}`);
      }

      res.status(201).json({
        ...account,
        currentBalanceCents: account.openingBalanceCents,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      console.error('Create account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateAccountSchema.parse(req.body);

      const [account] = await db
        .update(accounts)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(eq(accounts.id, id), eq(accounts.userId, req.userId!)))
        .returning();

      if (!account) {
        res.status(404).json({ error: 'Account not found' });
        return;
      }

      // Auto-translate account name if changed
      if (data.name && account.name) {
        translationQueue.add('accounts', account.id, 'name', account.name);
      }

      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      console.error('Update account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async archive(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // First delete all transactions for this account
      await db
        .delete(transactions)
        .where(and(
          eq(transactions.accountId, id),
          eq(transactions.userId, req.userId!)
        ));

      // Then delete the account itself
      const [account] = await db
        .delete(accounts)
        .where(and(eq(accounts.id, id), eq(accounts.userId, req.userId!)))
        .returning();

      if (!account) {
        res.status(404).json({ error: 'Account not found' });
        return;
      }

      console.log(`🗑️ Deleted account ${account.name} and all its transactions`);
      res.status(204).send();
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
