import { Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { transactions, accounts, categories, users, budgets } from '../../drizzle/schema.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { AuthRequest } from '../middleware/auth.js';
import { detectCategory, getCategoryIdByName } from '../utils/auto-category-detector.js';

const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(['income', 'expense', 'transfer']),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3),
  fxRate: z.number().positive().optional().default(1.0),
  date: z.string().datetime(),
  description: z.string().optional(),
  notes: z.string().optional(),
  attachmentRefs: z.array(z.string()).optional().default([]),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional().default([]),
  toAccountId: z.string().uuid().optional(),
});

const updateTransactionSchema = createTransactionSchema.partial();

export class TransactionsController {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { accountId, categoryId, startDate, endDate, limit = 100, offset = 0 } = req.query;

      let query = db.query.transactions.findMany({
        where: and(
          eq(transactions.userId, req.userId!),
          accountId ? eq(transactions.accountId, accountId as string) : undefined,
          categoryId ? eq(transactions.categoryId, categoryId as string) : undefined,
          startDate ? gte(transactions.date, new Date(startDate as string)) : undefined,
          endDate ? lte(transactions.date, new Date(endDate as string)) : undefined,
        ),
        orderBy: [desc(transactions.date)],
        limit: Number(limit),
        offset: Number(offset),
        with: {
          category: true,
          account: {
            columns: {
              id: true,
              name: true,
              type: true,
            },
          },
          toAccount: {
            columns: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      const result = await query;
      res.json(result);
    } catch (error) {
      console.error('List transactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = createTransactionSchema.parse(req.body);

      // Validate transfer has toAccountId
      if (data.type === 'transfer' && !data.toAccountId) {
        res.status(400).json({ error: 'Transfer requires toAccountId' });
        return;
      }

      const [transaction] = await db
        .insert(transactions)
        .values({
          ...data,
          userId: req.userId!,
          date: new Date(data.date),
          fxRate: data.fxRate.toString(),
        })
        .returning();

      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateTransactionSchema.parse(req.body);

      const [transaction] = await db
        .update(transactions)
        .set({
          ...data,
          date: data.date ? new Date(data.date) : undefined,
          fxRate: data.fxRate ? data.fxRate.toString() : undefined,
          updatedAt: new Date(),
        })
        .where(and(eq(transactions.id, id), eq(transactions.userId, req.userId!)))
        .returning();

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      console.error('Update transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Get transaction before deleting to check if it's an opening balance
      const transactionToDelete = await db.query.transactions.findFirst({
        where: and(eq(transactions.id, id), eq(transactions.userId, req.userId!))
      });

      if (!transactionToDelete) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      // Check if this is an opening balance transaction (for logging purposes only)
      const isOpeningBalance = transactionToDelete.description?.toLowerCase().includes('opening balance') ||
                               transactionToDelete.description?.toLowerCase().includes('anfangsbestand');

      if (isOpeningBalance) {
        console.log(`🗑️ Deleting opening balance transaction (${transactionToDelete.amountCents} cents). Opening balance will NOT be restored to avoid double counting on re-import.`);
      }

      // Hard delete
      await db
        .delete(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, req.userId!)));

      console.log(`🗑️ Deleted transaction ${transactionToDelete.description || 'Unnamed'} (${transactionToDelete.amountCents} cents)`);
      res.status(204).send();
    } catch (error) {
      console.error('Delete transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async importCsv(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      
      // Get CSV data and optional accountId from request body
      const csvData = req.body?.data;
      const accountIdFromRequest = req.body?.accountId;
      
      if (!csvData || typeof csvData !== 'string') {
        res.status(400).json({ 
          error: 'Invalid CSV data',
          message: 'Please provide valid CSV data in the request body'
        });
        return;
      }

      // Helper function to parse CSV line with proper quote handling
      // Supports both comma and tab separators
      const parseCSVLine = (line: string, separator: string = ','): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];
          
          if (char === '"' && inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else if (char === '"') {
            // Toggle quote mode
            inQuotes = !inQuotes;
          } else if (char === separator && !inQuotes) {
            // Field separator
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        // Add last field
        result.push(current.trim());
        return result;
      };

      // Detect separator (tab, semicolon or comma)
      const detectSeparator = (line: string): string => {
        // Count tabs, semicolons and commas
        const tabs = (line.match(/\t/g) || []).length;
        const semicolons = (line.match(/;/g) || []).length;
        const commas = (line.match(/,/g) || []).length;
        
        // Return the most common separator
        if (semicolons > tabs && semicolons > commas) return ';';
        if (tabs > commas) return '\t';
        return ',';
      };

      // Parse CSV with proper quote handling
      const lines = csvData.trim().split('\n').filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        res.status(400).json({ 
          error: 'Invalid CSV',
          message: 'CSV must contain at least a header row and one data row'
        });
        return;
      }

      // Skip metadata rows (like "Zahlungsübersicht", "Zahlungen aus...", "Übersicht", "Datum von:")
      let headerIndex = 0;
      for (let i = 0; i < lines.length && i < 15; i++) {
        const line = lines[i].toLowerCase();
        // Check if this line contains typical CSV headers
        if (line.includes('datum') && (line.includes('bewegungstyp') || line.includes('betrag') || 
            line.includes('gutschrift') || line.includes('lastschrift') || line.includes('avisierungstext'))) {
          headerIndex = i;
          break;
        }
      }

      // Remove metadata lines before header
      const csvLines = headerIndex > 0 ? lines.slice(headerIndex) : lines;

      // Detect separator from header line
      const separator = detectSeparator(csvLines[0]);
      console.log('Detected CSV separator:', separator === '\t' ? 'TAB' : separator === ';' ? 'SEMICOLON' : 'COMMA');

      // Parse header - flexible column mapping
      const rawHeaders = parseCSVLine(csvLines[0], separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
      const headers = rawHeaders.map(h => h.toLowerCase());
      
      // Map common variations to standard fields
      const fieldMapping: Record<string, string[]> = {
        'date': ['ausführungsdatum', 'ausfuehrungsdatum', 'date', 'datum', 'transaction date', 'buchungsdatum'],
        'amount': ['betrag', 'amount', 'menge', 'value', 'wert'],
        'credit': ['gutschrift', 'credit', 'haben', 'eingang', 'gutschriftinchf'],
        'debit': ['lastschrift', 'debit', 'soll', 'ausgang', 'belastung', 'lastschriftinchf'],
        'description': ['begünstigter', 'beguenstigter', 'empfänger', 'empfaenger', 'description', 'verwendungszweck', 'beschreibung', 'zweck', 'details', 'avisierungstext', 'avisierung'],
        'type': ['typ', 'type', 'art', 'transaction type', 'bewegungstyp'],
        'currency': ['währung', 'waehrung', 'currency'],
        'account': ['kto', 'konto', 'account'],
        'status': ['status'],
        'categoryField': ['category', 'kategorie', 'gruppe'],
        'label': ['label', 'tag', 'bezeichnung'],
        'notes': ['notes', 'notiz', 'notizen', 'bemerkung', 'hinweis']
      };
      
      // Find column indices for each field - use partial matching
      const columnMap: Record<string, number> = {};
      for (const [field, variations] of Object.entries(fieldMapping)) {
        const index = headers.findIndex(h => {
          // Remove special characters and spaces for better matching
          const cleanHeader = h.replace(/[\/\s]/g, '').toLowerCase();
          return variations.some(v => cleanHeader.includes(v.replace(/[\/\s]/g, '')));
        });
        if (index !== -1) columnMap[field] = index;
      }
      
      // Check if we have at least date and (amount OR credit/debit)
      console.log('Detected headers:', rawHeaders);
      console.log('Column mapping:', columnMap);
      
      const hasAmount = columnMap['amount'] !== undefined;
      const hasCreditDebit = columnMap['credit'] !== undefined || columnMap['debit'] !== undefined;
      
      if (columnMap['date'] === undefined || (!hasAmount && !hasCreditDebit)) {
        res.status(400).json({ 
          error: 'Invalid CSV format',
          message: 'CSV must contain date column and either amount column OR credit/debit columns',
          hint: 'Supported date columns: datum, date. Amount columns: betrag, amount. Or: gutschrift (credit) and lastschrift (debit)',
          detectedHeaders: rawHeaders,
          mappedColumns: columnMap
        });
        return;
      }

      // Get user's default currency
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { defaultCurrency: true }
      });

      // If accountId is provided, validate it; otherwise get all accounts
      let targetAccount;
      if (accountIdFromRequest) {
        targetAccount = await db.query.accounts.findFirst({
          where: and(
            eq(accounts.id, accountIdFromRequest),
            eq(accounts.userId, userId)
          )
        });
        
        if (!targetAccount) {
          res.status(400).json({ 
            error: 'Invalid account',
            message: 'The specified account does not exist or does not belong to you'
          });
          return;
        }
      } else {
        // Fallback: use first account if no accountId provided
        const allUserAccounts = await db.query.accounts.findMany({
          where: eq(accounts.userId, userId)
        });
        
        if (!allUserAccounts || allUserAccounts.length === 0) {
          res.status(400).json({ 
            error: 'No account found',
            message: 'Please create an account before importing transactions'
          });
          return;
        }
        
        targetAccount = allUserAccounts[0];
      }

      // Parse transactions
      const importedTransactions = [];
      const errors = [];

      for (let i = 1; i < csvLines.length; i++) {
        try {
          const line = csvLines[i].trim();
          if (!line) continue; // Skip empty lines
          
          const values = parseCSVLine(line, separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
          
          // Extract values using column mapping
          const getField = (field: string) => {
            const idx = columnMap[field];
            return idx !== undefined ? values[idx] : '';
          };

          // Parse date - support multiple formats
          const dateStr = getField('date');
          if (!dateStr) {
            errors.push(`Row ${i + 1}: Missing date`);
            continue;
          }
          
          // Try parsing various date formats: DD.MM.YY, DD.MM.YYYY, YYYY-MM-DD, MM/DD/YYYY
          let date: Date;
          if (dateStr.includes('.')) {
            // DD.MM.YY or DD.MM.YYYY format
            const parts = dateStr.split('.');
            let day = parts[0];
            let month = parts[1];
            let year = parts[2];
            
            // Handle 2-digit year (25 -> 2025, 21 -> 2021)
            if (year.length === 2) {
              const yearNum = parseInt(year);
              year = yearNum <= 50 ? `20${year}` : `19${year}`;
            }
            
            date = new Date(`${year}-${month}-${day}`);
          } else if (dateStr.includes('/')) {
            // MM/DD/YYYY or DD/MM/YYYY
            date = new Date(dateStr);
          } else {
            // ISO format YYYY-MM-DD
            date = new Date(dateStr);
          }
          
          if (isNaN(date.getTime())) {
            errors.push(`Row ${i + 1}: Invalid date format "${dateStr}"`);
            continue;
          }

          // Parse amount - handle credit/debit columns or single amount column
          let amount = 0;
          let transactionType: 'income' | 'expense' | 'transfer' = 'expense';
          
          const creditStr = getField('credit');
          const debitStr = getField('debit');
          const amountStr = getField('amount');
          
          // If we have separate credit/debit columns
          if (creditStr || debitStr) {
            if (creditStr && creditStr !== '') {
              amount = parseFloat(creditStr.replace(/[^0-9.,-]/g, '').replace(',', '.'));
              transactionType = 'income';
            } else if (debitStr && debitStr !== '') {
              amount = Math.abs(parseFloat(debitStr.replace(/[^0-9.,-]/g, '').replace(',', '.')));
              transactionType = 'expense';
            }
          } else if (amountStr && amountStr !== '') {
            // Single amount column
            const cleanAmount = amountStr.replace(/[^0-9.,-]/g, '');
            amount = Math.abs(parseFloat(cleanAmount.replace(',', '.')));
            
            // Determine type from sign
            if (amountStr.includes('-')) {
              transactionType = 'expense';
            } else {
              transactionType = 'income';
            }
          } else {
            errors.push(`Row ${i + 1}: Missing amount`);
            continue;
          }

          if (isNaN(amount) || amount === 0) {
            errors.push(`Row ${i + 1}: Invalid amount`);
            continue;
          }

          // Get description - use first available field
          const description = getField('description') || 
                            getField('type') || 
                            'Imported transaction';

          // Get category from label or categoryField
          const labelStr = getField('label') || getField('categoryField');
          let categoryName = null;
          let categoryId = null;
          
          if (labelStr && labelStr.trim() !== '') {
            // Extract category name (e.g., "Einkaufen // Supermärkte" -> "Einkaufen")
            categoryName = labelStr.split('//')[0].trim();
            
            if (categoryName) {
              // Try to find or create matching category
              const existingCategory = await db.query.categories.findFirst({
                where: and(
                  eq(categories.userId, userId),
                  eq(categories.name, categoryName)
                )
              });
              
              if (existingCategory) {
                categoryId = existingCategory.id;
                console.log(`Found existing category: ${categoryName} (ID: ${categoryId})`);
              } else {
                // Create new category
                const [newCategory] = await db
                  .insert(categories)
                  .values({
                    userId,
                    name: categoryName,
                  })
                  .returning();
                categoryId = newCategory.id;
                console.log(`Created new category: ${categoryName} (ID: ${categoryId})`);
              }
            }
          }

          // AUTO-DETECT: If no category found, try intelligent detection based on description
          if (!categoryId && description) {
            const detectedCategoryName = detectCategory(description);
            if (detectedCategoryName) {
              console.log(`🎯 Auto-detected category: "${detectedCategoryName}" from description: "${description}"`);
              
              // Get all user categories for matching
              const userCategories = await db.query.categories.findMany({
                where: eq(categories.userId, userId)
              });
              
              categoryId = getCategoryIdByName(userCategories, detectedCategoryName);
              
              if (categoryId) {
                console.log(`✅ Matched to existing category ID: ${categoryId}`);
              } else {
                console.log(`⚠️  Category "${detectedCategoryName}" not found, will use null`);
              }
            }
          }

          // Use the target account (either from request or default first account)
          const transactionData = {
            userId,
            accountId: targetAccount.id,
            type: transactionType,
            amountCents: Math.abs(Math.round(amount * 100)),
            currency: getField('currency') || user?.defaultCurrency || targetAccount.currency || 'EUR',
            date,
            description: description.substring(0, 255), // Limit length
            categoryId: categoryId,
            notes: labelStr || getField('notes') || null,
            attachmentRefs: [],
            tags: [],
          };

          console.log(`Importing transaction ${i}: ${description.substring(0, 50)}, Date: ${date.toISOString()}, Amount: ${amount}, Type: ${transactionType}`);

          // Create transaction
          const [transaction] = await db
            .insert(transactions)
            .values(transactionData)
            .returning();

          importedTransactions.push(transaction);
        } catch (error: any) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      // Auto-detect budget suggestions for categories without budgets
      const budgetSuggestions = await this.generateBudgetSuggestions(userId, importedTransactions);

      res.status(200).json({ 
        success: true,
        message: `Successfully imported ${importedTransactions.length} transactions`,
        imported: importedTransactions.length,
        errors: errors.length > 0 ? errors : undefined,
        transactions: importedTransactions,
        budgetSuggestions: budgetSuggestions.length > 0 ? budgetSuggestions : undefined
      });
    } catch (error) {
      console.error('Import CSV error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Generate budget suggestions based on imported transactions
  private async generateBudgetSuggestions(userId: string, importedTransactions: any[]) {
    try {
      // Get all existing budgets for this user
      const existingBudgets = await db.query.budgets.findMany({
        where: eq(budgets.userId, userId)
      });

      // Get all categories from imported expense transactions
      const categorySpending = new Map<string, { categoryId: string; categoryName: string; totalAmount: number; count: number }>();

      for (const tx of importedTransactions) {
        if (tx.type === 'expense' && tx.categoryId) {
          // Get category details
          const category = await db.query.categories.findFirst({
            where: eq(categories.id, tx.categoryId)
          });

          if (category) {
            const existing = categorySpending.get(tx.categoryId);
            const amount = tx.amountCents / 100;
            
            if (existing) {
              existing.totalAmount += amount;
              existing.count += 1;
            } else {
              categorySpending.set(tx.categoryId, {
                categoryId: tx.categoryId,
                categoryName: category.name,
                totalAmount: amount,
                count: 1
              });
            }
          }
        }
      }

      // Check which categories don't have budgets yet
      const suggestions = [];
      for (const [categoryId, data] of categorySpending.entries()) {
        const hasBudget = existingBudgets.some(b => b.categoryId === categoryId);
        
        if (!hasBudget) {
          // Suggest a monthly budget based on spending
          const suggestedMonthlyAmount = Math.ceil(data.totalAmount * 1.1); // Add 10% buffer
          
          suggestions.push({
            categoryId: data.categoryId,
            categoryName: data.categoryName,
            suggestedAmount: suggestedMonthlyAmount,
            basedOnSpending: data.totalAmount,
            transactionCount: data.count,
            period: 'monthly',
            currency: 'CHF' // Default, should be from user preference
          });
          
          console.log(`💡 Budget suggestion: ${data.categoryName} - ${suggestedMonthlyAmount} CHF (based on ${data.totalAmount} spent in ${data.count} transactions)`);
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating budget suggestions:', error);
      return [];
    }
  }
}
