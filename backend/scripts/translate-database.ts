/**
 * Database Translation Script
 * Automatically translates existing database content to all supported languages
 *
 * Usage: tsx scripts/translate-database.ts [options]
 * Options:
 *   --table <table>  Translate only specific table (accounts, categories, budgets, etc.)
 *   --dry-run        Preview translations without saving to database
 *   --user <userId>  Translate content for specific user only
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { accounts, categories, transactions, budgets, rules, goals, tradingAgents } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Simple translation service (replace with actual API calls in production)
type SupportedLanguage = 'en' | 'de' | 'fr' | 'ar';

interface TranslationResult {
  [key: string]: string;
}

/**
 * Detects the language of a given text using simple heuristics
 */
function detectLanguage(text: string): SupportedLanguage {
  if (!text || text.trim().length === 0) return 'en';

  // Arabic detection
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';

  // German-specific characters
  if (/[äöüßÄÖÜ]/.test(text)) return 'de';

  // German-specific patterns (including months and common words)
  const germanWords = /\b(monatliche|ausgaben|augaben|november|dezember|januar|februar|märz|april|mai|juni|juli|august|september|oktober|quartal|der|die|das|ist|und|oder|aber|mit|von|für|auf|an|zu|den|dem|des|ein|eine|einen|einem|eines|nicht|sich|sie|es|er|ich|du|wir|ihr|was|wie|wo|wann|warum|wer|werden|wurde|worden|sein|haben|hatte|hatten|wird|kann|könnte|soll|sollte|müssen|musste|dürfen|möchte|mögen)\b/i;
  if (germanWords.test(text)) return 'de';

  // French-specific patterns
  const frenchWords = /\b(le|la|les|un|une|des|et|ou|mais|donc|car|ni|or|de|du|à|au|aux|dans|par|pour|avec|sans|sur|sous|je|tu|il|elle|nous|vous|ils|elles|est|sont|était|étaient|sera|seront|avoir|été|être|fait|faire|dit|dire|peut|peuvent|doit|doivent|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|ç|é|è|ê|ë|à|â|î|ï|ô|ù|û|ü)\b/i;
  if (frenchWords.test(text)) return 'fr';

  return 'en';
}

/**
 * Translates text using LibreTranslate API
 */
async function translateText(
  text: string,
  targetLang: SupportedLanguage,
  sourceLang: SupportedLanguage
): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  if (sourceLang === targetLang) return text;

  const LIBRETRANSLATE_API = process.env.LIBRETRANSLATE_API || 'https://libretranslate.com/translate';

  try {
    const response = await fetch(LIBRETRANSLATE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
      }),
    });

    if (!response.ok) {
      console.error(`Translation failed (${sourceLang} -> ${targetLang}): ${response.statusText}`);
      return text;
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error(`Error translating to ${targetLang}:`, error);
    return text;
  }
}

/**
 * Translates text to all supported languages
 */
async function translateToAllLanguages(
  text: string,
  sourceLang?: SupportedLanguage
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return { en: '', de: '', fr: '', ar: '' };
  }

  const source = sourceLang || detectLanguage(text);
  const targetLanguages: SupportedLanguage[] = ['en', 'de', 'fr', 'ar'];
  const translations: TranslationResult = {
    [source]: text,
  };

  console.log(`  Translating from ${source}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

  for (const targetLang of targetLanguages) {
    if (targetLang === source) continue;

    const translated = await translateText(text, targetLang, source);
    translations[targetLang] = translated;

    console.log(`    -> ${targetLang}: "${translated.substring(0, 50)}${translated.length > 50 ? '...' : ''}"`);

    // Rate limiting: wait 600ms between requests
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  return translations;
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const tableArg = args.indexOf('--table');
const targetTable = tableArg !== -1 ? args[tableArg + 1] : null;
const userArg = args.indexOf('--user');
const targetUserId = userArg !== -1 ? args[userArg + 1] : null;

async function main() {
  console.log('=== Database Translation Script ===\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be saved)' : 'LIVE (will update database)'}`);
  console.log(`Table filter: ${targetTable || 'all tables'}`);
  console.log(`User filter: ${targetUserId || 'all users'}\n`);

  // Connect to database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    // Translate Accounts
    if (!targetTable || targetTable === 'accounts') {
      console.log('\n[1/7] Translating Accounts...');
      const accountsData = await db.select().from(accounts);
      const filteredAccounts = targetUserId
        ? accountsData.filter(a => a.userId === targetUserId)
        : accountsData;

      console.log(`Found ${filteredAccounts.length} accounts to translate`);

      for (const account of filteredAccounts) {
        if (!account.name) continue;

        const translations = await translateToAllLanguages(account.name);

        if (!dryRun) {
          await db.update(accounts)
            .set({ nameTranslations: translations })
            .where(eq(accounts.id, account.id));
        }
      }
    }

    // Translate Categories
    if (!targetTable || targetTable === 'categories') {
      console.log('\n[2/7] Translating Categories...');
      const categoriesData = await db.select().from(categories);
      const filteredCategories = targetUserId
        ? categoriesData.filter(c => c.userId === targetUserId)
        : categoriesData;

      console.log(`Found ${filteredCategories.length} categories to translate`);

      for (const category of filteredCategories) {
        if (!category.name) continue;

        const translations = await translateToAllLanguages(category.name);

        if (!dryRun) {
          await db.update(categories)
            .set({ nameTranslations: translations })
            .where(eq(categories.id, category.id));
        }
      }
    }

    // Translate Budgets
    if (!targetTable || targetTable === 'budgets') {
      console.log('\n[3/7] Translating Budgets...');
      const budgetsData = await db.select().from(budgets);
      const filteredBudgets = targetUserId
        ? budgetsData.filter(b => b.userId === targetUserId)
        : budgetsData;

      console.log(`Found ${filteredBudgets.length} budgets to translate`);

      for (const budget of filteredBudgets) {
        if (!budget.name) continue;

        const translations = await translateToAllLanguages(budget.name);

        if (!dryRun) {
          await db.update(budgets)
            .set({ nameTranslations: translations })
            .where(eq(budgets.id, budget.id));
        }
      }
    }

    // Translate Transactions
    if (!targetTable || targetTable === 'transactions') {
      console.log('\n[4/7] Translating Transactions...');
      const transactionsData = await db.select().from(transactions);
      const filteredTransactions = targetUserId
        ? transactionsData.filter(t => t.userId === targetUserId)
        : transactionsData;

      console.log(`Found ${filteredTransactions.length} transactions to translate`);

      for (const transaction of filteredTransactions) {
        const updates: any = {};

        if (transaction.description) {
          console.log(`  Transaction ${transaction.id} - description`);
          updates.descriptionTranslations = await translateToAllLanguages(transaction.description);
        }

        if (transaction.notes) {
          console.log(`  Transaction ${transaction.id} - notes`);
          updates.notesTranslations = await translateToAllLanguages(transaction.notes);
        }

        if (Object.keys(updates).length > 0 && !dryRun) {
          await db.update(transactions)
            .set(updates)
            .where(eq(transactions.id, transaction.id));
        }
      }
    }

    // Translate Goals
    if (!targetTable || targetTable === 'goals') {
      console.log('\n[5/7] Translating Goals...');
      const goalsData = await db.select().from(goals);
      const filteredGoals = targetUserId
        ? goalsData.filter(g => g.userId === targetUserId)
        : goalsData;

      console.log(`Found ${filteredGoals.length} goals to translate`);

      for (const goal of filteredGoals) {
        const updates: any = {};

        if (goal.name) {
          console.log(`  Goal ${goal.id} - name`);
          updates.nameTranslations = await translateToAllLanguages(goal.name);
        }

        if (goal.notes) {
          console.log(`  Goal ${goal.id} - notes`);
          updates.notesTranslations = await translateToAllLanguages(goal.notes);
        }

        if (Object.keys(updates).length > 0 && !dryRun) {
          await db.update(goals)
            .set(updates)
            .where(eq(goals.id, goal.id));
        }
      }
    }

    // Translate Rules
    if (!targetTable || targetTable === 'rules') {
      console.log('\n[6/7] Translating Rules...');
      const rulesData = await db.select().from(rules);
      const filteredRules = targetUserId
        ? rulesData.filter(r => r.userId === targetUserId)
        : rulesData;

      console.log(`Found ${filteredRules.length} rules to translate`);

      for (const rule of filteredRules) {
        if (!rule.name) continue;

        const translations = await translateToAllLanguages(rule.name);

        if (!dryRun) {
          await db.update(rules)
            .set({ nameTranslations: translations })
            .where(eq(rules.id, rule.id));
        }
      }
    }

    // Translate Trading Agents
    if (!targetTable || targetTable === 'trading_agents') {
      console.log('\n[7/7] Translating Trading Agents...');
      const tradingAgentsData = await db.select().from(tradingAgents);
      const filteredTradingAgents = targetUserId
        ? tradingAgentsData.filter(ta => ta.userId === targetUserId)
        : tradingAgentsData;

      console.log(`Found ${filteredTradingAgents.length} trading agents to translate`);

      for (const agent of filteredTradingAgents) {
        if (!agent.name) continue;

        const translations = await translateToAllLanguages(agent.name);

        if (!dryRun) {
          await db.update(tradingAgents)
            .set({ nameTranslations: translations })
            .where(eq(tradingAgents.id, agent.id));
        }
      }
    }

    console.log('\n=== Translation Complete! ===');
    if (dryRun) {
      console.log('DRY RUN: No changes were saved to the database.');
      console.log('Run without --dry-run to apply translations.');
    }

  } catch (error) {
    console.error('Error during translation:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
