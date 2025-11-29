// @ts-nocheck
import { Request, Response } from 'express';
import { db } from '../db.js';
import { bankConnections, linkedBankAccounts, accounts, transactions } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

// GoCardless Bank Account Data API (formerly Nordigen) - FREE tier
const GOCARDLESS_BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';

// Get GoCardless access token
const getGoCardlessToken = async (): Promise<string | null> => {
  const secretId = process.env.GOCARDLESS_SECRET_ID;
  const secretKey = process.env.GOCARDLESS_SECRET_KEY;
  
  if (!secretId || !secretKey) {
    console.error('GoCardless credentials not configured');
    return null;
  }

  try {
    const response = await fetch(`${GOCARDLESS_BASE_URL}/token/new/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret_id: secretId,
        secret_key: secretKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access;
  } catch (error) {
    console.error('Error getting GoCardless token:', error);
    return null;
  }
};

// Get list of supported banks/institutions
export const getInstitutions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { country = 'CH' } = req.query; // Default to Switzerland

    const token = await getGoCardlessToken();
    if (!token) {
      return res.status(500).json({ error: 'Banking service unavailable' });
    }

    const response = await fetch(
      `${GOCARDLESS_BASE_URL}/institutions/?country=${country}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch institutions: ${response.statusText}`);
    }

    const institutions = await response.json();

    // Map to simpler format
    const mappedInstitutions = institutions.map((inst: any) => ({
      id: inst.id,
      name: inst.name,
      logo: inst.logo,
      countries: inst.countries,
      transactionDays: inst.transaction_total_days,
    }));

    res.json(mappedInstitutions);
  } catch (error) {
    console.error('Error fetching institutions:', error);
    res.status(500).json({ error: 'Failed to fetch banking institutions' });
  }
};

// Create bank connection (requisition)
export const createBankConnection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { institutionId, institutionName, institutionLogo } = req.body;

    if (!institutionId || !institutionName) {
      return res.status(400).json({ error: 'Institution ID and name are required' });
    }

    const token = await getGoCardlessToken();
    if (!token) {
      return res.status(500).json({ error: 'Banking service unavailable' });
    }

    // Create end-user agreement (90 days access)
    const agreementResponse = await fetch(`${GOCARDLESS_BASE_URL}/agreements/enduser/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        institution_id: institutionId,
        max_historical_days: 90,
        access_valid_for_days: 90,
        access_scope: ['balances', 'details', 'transactions'],
      }),
    });

    if (!agreementResponse.ok) {
      const error = await agreementResponse.text();
      console.error('Agreement creation failed:', error);
      throw new Error('Failed to create bank agreement');
    }

    const agreement = await agreementResponse.json();

    // Create requisition (link)
    const redirectUrl = `${process.env.FRONTEND_URL || 'https://finflowapp.ch'}/settings/banking/callback`;
    
    const requisitionResponse = await fetch(`${GOCARDLESS_BASE_URL}/requisitions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        redirect: redirectUrl,
        institution_id: institutionId,
        agreement: agreement.id,
        user_language: 'DE',
      }),
    });

    if (!requisitionResponse.ok) {
      const error = await requisitionResponse.text();
      console.error('Requisition creation failed:', error);
      throw new Error('Failed to create bank connection');
    }

    const requisition = await requisitionResponse.json();

    // Save connection to database
    const [connection] = await db
      .insert(bankConnections)
      .values({
        userId,
        provider: 'gocardless',
        institutionId,
        institutionName,
        institutionLogo: institutionLogo || null,
        requisitionId: requisition.id,
        agreementId: agreement.id,
        status: 'pending',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      })
      .returning();

    res.json({
      connectionId: connection.id,
      authUrl: requisition.link, // URL to redirect user to for bank authentication
    });
  } catch (error) {
    console.error('Error creating bank connection:', error);
    res.status(500).json({ error: 'Failed to create bank connection' });
  }
};

// Handle callback after bank authentication
export const handleBankCallback = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { requisitionId } = req.params;

    if (!requisitionId) {
      return res.status(400).json({ error: 'Requisition ID is required' });
    }

    const token = await getGoCardlessToken();
    if (!token) {
      return res.status(500).json({ error: 'Banking service unavailable' });
    }

    // Get requisition details
    const response = await fetch(`${GOCARDLESS_BASE_URL}/requisitions/${requisitionId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch requisition');
    }

    const requisition = await response.json();

    // Find connection in database
    const [connection] = await db
      .select()
      .from(bankConnections)
      .where(and(eq(bankConnections.userId, userId), eq(bankConnections.requisitionId, requisitionId)));

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Update connection status
    const newStatus = requisition.status === 'LN' ? 'linked' : requisition.status === 'EX' ? 'expired' : 'error';
    
    await db
      .update(bankConnections)
      .set({
        status: newStatus,
        errorMessage: requisition.status !== 'LN' ? `Status: ${requisition.status}` : null,
        updatedAt: new Date(),
      })
      .where(eq(bankConnections.id, connection.id));

    // If linked, fetch accounts
    if (newStatus === 'linked' && requisition.accounts && requisition.accounts.length > 0) {
      for (const accountId of requisition.accounts) {
        // Get account details
        const accountResponse = await fetch(`${GOCARDLESS_BASE_URL}/accounts/${accountId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (accountResponse.ok) {
          const accountData = await accountResponse.json();

          // Get account details (IBAN, name, etc.)
          const detailsResponse = await fetch(`${GOCARDLESS_BASE_URL}/accounts/${accountId}/details/`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          let details: any = {};
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            details = detailsData.account || {};
          }

          // Get balance
          const balanceResponse = await fetch(`${GOCARDLESS_BASE_URL}/accounts/${accountId}/balances/`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          let balance = 0;
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            const balanceInfo = balanceData.balances?.find((b: any) => b.balanceType === 'expected') || balanceData.balances?.[0];
            if (balanceInfo) {
              balance = Math.round(parseFloat(balanceInfo.balanceAmount.amount) * 100);
            }
          }

          // Save linked bank account
          await db.insert(linkedBankAccounts).values({
            userId,
            connectionId: connection.id,
            externalAccountId: accountId,
            iban: details.iban || accountData.iban || null,
            accountName: details.name || details.product || 'Bank Account',
            accountType: details.cashAccountType || 'checking',
            currency: details.currency || accountData.currency || 'EUR',
            balanceCents: balance,
            balanceUpdatedAt: new Date(),
          });
        }
      }
    }

    res.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Error handling bank callback:', error);
    res.status(500).json({ error: 'Failed to complete bank connection' });
  }
};

// Get user's bank connections
export const getBankConnections = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const connections = await db
      .select()
      .from(bankConnections)
      .where(eq(bankConnections.userId, userId))
      .orderBy(desc(bankConnections.createdAt));

    // Get linked accounts for each connection
    const connectionsWithAccounts = await Promise.all(
      connections.map(async (conn) => {
        const linkedAccounts = await db
          .select()
          .from(linkedBankAccounts)
          .where(eq(linkedBankAccounts.connectionId, conn.id));

        return {
          ...conn,
          accounts: linkedAccounts,
        };
      })
    );

    res.json(connectionsWithAccounts);
  } catch (error) {
    console.error('Error fetching bank connections:', error);
    res.status(500).json({ error: 'Failed to fetch bank connections' });
  }
};

// Delete bank connection
export const deleteBankConnection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Verify ownership
    const [connection] = await db
      .select()
      .from(bankConnections)
      .where(and(eq(bankConnections.id, id), eq(bankConnections.userId, userId)));

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Delete from GoCardless
    if (connection.requisitionId) {
      const token = await getGoCardlessToken();
      if (token) {
        await fetch(`${GOCARDLESS_BASE_URL}/requisitions/${connection.requisitionId}/`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }

    // Delete from database (cascades to linked accounts)
    await db.delete(bankConnections).where(eq(bankConnections.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bank connection:', error);
    res.status(500).json({ error: 'Failed to delete bank connection' });
  }
};

// Sync transactions from bank
export const syncBankTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { linkedAccountId } = req.params;

    // Get linked account
    const [linkedAccount] = await db
      .select()
      .from(linkedBankAccounts)
      .where(and(eq(linkedBankAccounts.id, linkedAccountId), eq(linkedBankAccounts.userId, userId)));

    if (!linkedAccount) {
      return res.status(404).json({ error: 'Linked account not found' });
    }

    if (!linkedAccount.finflowAccountId) {
      return res.status(400).json({ error: 'Please link this bank account to a FinFlow account first' });
    }

    const token = await getGoCardlessToken();
    if (!token) {
      return res.status(500).json({ error: 'Banking service unavailable' });
    }

    // Fetch transactions from bank
    const response = await fetch(
      `${GOCARDLESS_BASE_URL}/accounts/${linkedAccount.externalAccountId}/transactions/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();
    const bankTransactions = data.transactions?.booked || [];

    let imported = 0;
    let skipped = 0;

    for (const txn of bankTransactions) {
      // Skip if already imported (based on transactionId)
      const existingTxn = await db.execute(
        sql`SELECT id FROM transactions WHERE description LIKE ${'%[BANK:' + txn.transactionId + ']%'} AND user_id = ${userId}`
      );

      if (existingTxn.rows && existingTxn.rows.length > 0) {
        skipped++;
        continue;
      }

      const amount = Math.round(parseFloat(txn.transactionAmount.amount) * 100);
      const type = amount >= 0 ? 'income' : 'expense';

      await db.insert(transactions).values({
        userId,
        accountId: linkedAccount.finflowAccountId!,
        type,
        amountCents: Math.abs(amount),
        currency: txn.transactionAmount.currency || linkedAccount.currency,
        date: new Date(txn.bookingDate || txn.valueDate),
        description: `${txn.remittanceInformationUnstructured || txn.creditorName || txn.debtorName || 'Bank Transaction'} [BANK:${txn.transactionId}]`,
      });

      imported++;
    }

    // Update last sync time
    await db
      .update(linkedBankAccounts)
      .set({
        lastTransactionId: bankTransactions[0]?.transactionId || linkedAccount.lastTransactionId,
        updatedAt: new Date(),
      })
      .where(eq(linkedBankAccounts.id, linkedAccountId));

    // Also update connection last sync
    await db
      .update(bankConnections)
      .set({ lastSync: new Date() })
      .where(eq(bankConnections.id, linkedAccount.connectionId));

    res.json({
      success: true,
      imported,
      skipped,
      total: bankTransactions.length,
    });
  } catch (error) {
    console.error('Error syncing bank transactions:', error);
    res.status(500).json({ error: 'Failed to sync bank transactions' });
  }
};

// Link bank account to FinFlow account
export const linkToFinFlowAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { linkedAccountId, finflowAccountId } = req.body;

    if (!linkedAccountId || !finflowAccountId) {
      return res.status(400).json({ error: 'Both account IDs are required' });
    }

    // Verify ownership of linked account
    const [linkedAccount] = await db
      .select()
      .from(linkedBankAccounts)
      .where(and(eq(linkedBankAccounts.id, linkedAccountId), eq(linkedBankAccounts.userId, userId)));

    if (!linkedAccount) {
      return res.status(404).json({ error: 'Linked bank account not found' });
    }

    // Verify ownership of FinFlow account
    const [finflowAccount] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, finflowAccountId), eq(accounts.userId, userId)));

    if (!finflowAccount) {
      return res.status(404).json({ error: 'FinFlow account not found' });
    }

    // Update link
    await db
      .update(linkedBankAccounts)
      .set({
        finflowAccountId,
        updatedAt: new Date(),
      })
      .where(eq(linkedBankAccounts.id, linkedAccountId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error linking accounts:', error);
    res.status(500).json({ error: 'Failed to link accounts' });
  }
};

// Refresh bank balance
export const refreshBankBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { linkedAccountId } = req.params;

    const [linkedAccount] = await db
      .select()
      .from(linkedBankAccounts)
      .where(and(eq(linkedBankAccounts.id, linkedAccountId), eq(linkedBankAccounts.userId, userId)));

    if (!linkedAccount) {
      return res.status(404).json({ error: 'Linked account not found' });
    }

    const token = await getGoCardlessToken();
    if (!token) {
      return res.status(500).json({ error: 'Banking service unavailable' });
    }

    const response = await fetch(
      `${GOCARDLESS_BASE_URL}/accounts/${linkedAccount.externalAccountId}/balances/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }

    const data = await response.json();
    const balanceInfo = data.balances?.find((b: any) => b.balanceType === 'expected') || data.balances?.[0];

    if (balanceInfo) {
      const balance = Math.round(parseFloat(balanceInfo.balanceAmount.amount) * 100);

      await db
        .update(linkedBankAccounts)
        .set({
          balanceCents: balance,
          balanceUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(linkedBankAccounts.id, linkedAccountId));

      res.json({
        success: true,
        balance: balance / 100,
        currency: balanceInfo.balanceAmount.currency,
      });
    } else {
      res.json({ success: false, message: 'No balance information available' });
    }
  } catch (error) {
    console.error('Error refreshing balance:', error);
    res.status(500).json({ error: 'Failed to refresh balance' });
  }
};
