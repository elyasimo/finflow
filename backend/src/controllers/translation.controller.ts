// @ts-nocheck
import { Request, Response } from 'express';
import { db } from '../db.js';
import { accounts, categories, transactions, budgets, rules, goals, tradingAgents } from '../db/schema.js';
import { eq } from 'drizzle-orm';

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

  // German-specific patterns
  const germanWords = /\b(der|die|das|ist|und|oder|aber|mit|von|für|auf|an|zu|den|dem|des|ein|eine|einen|einem|eines|nicht|sich|sie|es|er|ich|du|wir|ihr|was|wie|wo|wann|warum|wer|werden|wurde|worden|sein|haben|hatte|hatten|wird|kann|könnte|soll|sollte|müssen|musste|dürfen|möchte|mögen|ä|ö|ü|ß)\b/i;
  if (germanWords.test(text)) return 'de';

  // French-specific patterns
  const frenchWords = /\b(le|la|les|un|une|des|et|ou|mais|donc|car|ni|or|de|du|à|au|aux|dans|par|pour|avec|sans|sur|sous|je|tu|il|elle|nous|vous|ils|elles|est|sont|était|étaient|sera|seront|avoir|été|être|fait|faire|dit|dire|peut|peuvent|doit|doivent|ç|é|è|ê|ë|à|â|î|ï|ô|ù|û|ü)\b/i;
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

  for (const targetLang of targetLanguages) {
    if (targetLang === source) continue;

    const translated = await translateText(text, targetLang, source);
    translations[targetLang] = translated;

    // Rate limiting: wait 600ms between requests
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  return translations;
}

export class TranslationController {
  /**
   * POST /translations/translate-all
   * Translates all database content for the authenticated user
   */
  async translateAll(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { table, dryRun = false } = req.body;

      const stats = {
        accounts: 0,
        categories: 0,
        budgets: 0,
        transactions: 0,
        goals: 0,
        rules: 0,
        tradingAgents: 0,
      };

      // Translate Accounts
      if (!table || table === 'accounts') {
        const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, userId));
        for (const account of userAccounts) {
          if (!account.name) continue;
          const translations = await translateToAllLanguages(account.name);
          if (!dryRun) {
            await db.update(accounts)
              .set({ nameTranslations: translations })
              .where(eq(accounts.id, account.id));
          }
          stats.accounts++;
        }
      }

      // Translate Categories
      if (!table || table === 'categories') {
        const userCategories = await db.select().from(categories).where(eq(categories.userId, userId));
        for (const category of userCategories) {
          if (!category.name) continue;
          const translations = await translateToAllLanguages(category.name);
          if (!dryRun) {
            await db.update(categories)
              .set({ nameTranslations: translations })
              .where(eq(categories.id, category.id));
          }
          stats.categories++;
        }
      }

      // Translate Budgets
      if (!table || table === 'budgets') {
        const userBudgets = await db.select().from(budgets).where(eq(budgets.userId, userId));
        for (const budget of userBudgets) {
          if (!budget.name) continue;
          const translations = await translateToAllLanguages(budget.name);
          if (!dryRun) {
            await db.update(budgets)
              .set({ nameTranslations: translations })
              .where(eq(budgets.id, budget.id));
          }
          stats.budgets++;
        }
      }

      // Translate Transactions (limited to avoid long requests)
      if (!table || table === 'transactions') {
        const userTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId));
        for (const transaction of userTransactions.slice(0, 100)) { // Limit to 100 transactions
          const updates: any = {};
          if (transaction.description) {
            updates.descriptionTranslations = await translateToAllLanguages(transaction.description);
          }
          if (transaction.notes) {
            updates.notesTranslations = await translateToAllLanguages(transaction.notes);
          }
          if (Object.keys(updates).length > 0 && !dryRun) {
            await db.update(transactions)
              .set(updates)
              .where(eq(transactions.id, transaction.id));
          }
          if (Object.keys(updates).length > 0) {
            stats.transactions++;
          }
        }
      }

      // Translate Goals
      if (!table || table === 'goals') {
        const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));
        for (const goal of userGoals) {
          const updates: any = {};
          if (goal.name) {
            updates.nameTranslations = await translateToAllLanguages(goal.name);
          }
          if (goal.notes) {
            updates.notesTranslations = await translateToAllLanguages(goal.notes);
          }
          if (Object.keys(updates).length > 0 && !dryRun) {
            await db.update(goals)
              .set(updates)
              .where(eq(goals.id, goal.id));
          }
          if (Object.keys(updates).length > 0) {
            stats.goals++;
          }
        }
      }

      // Translate Rules
      if (!table || table === 'rules') {
        const userRules = await db.select().from(rules).where(eq(rules.userId, userId));
        for (const rule of userRules) {
          if (!rule.name) continue;
          const translations = await translateToAllLanguages(rule.name);
          if (!dryRun) {
            await db.update(rules)
              .set({ nameTranslations: translations })
              .where(eq(rules.id, rule.id));
          }
          stats.rules++;
        }
      }

      // Translate Trading Agents
      if (!table || table === 'trading_agents') {
        const userTradingAgents = await db.select().from(tradingAgents).where(eq(tradingAgents.userId, userId));
        for (const agent of userTradingAgents) {
          if (!agent.name) continue;
          const translations = await translateToAllLanguages(agent.name);
          if (!dryRun) {
            await db.update(tradingAgents)
              .set({ nameTranslations: translations })
              .where(eq(tradingAgents.id, agent.id));
          }
          stats.tradingAgents++;
        }
      }

      return res.json({
        message: dryRun ? 'Translation preview completed' : 'Translation completed successfully',
        stats,
        dryRun,
      });
    } catch (error) {
      console.error('Translation error:', error);
      return res.status(500).json({ error: 'Failed to translate content' });
    }
  }

  /**
   * POST /translations/translate-text
   * Translates a single text to a target language
   */
  async translateText(req: Request, res: Response) {
    try {
      const { text, targetLanguage, sourceLanguage } = req.body;

      if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Missing required fields: text, targetLanguage' });
      }

      const source = sourceLanguage || detectLanguage(text);
      const translated = await translateText(text, targetLanguage as SupportedLanguage, source);

      return res.json({
        original: text,
        translated,
        sourceLanguage: source,
        targetLanguage,
      });
    } catch (error) {
      console.error('Translation error:', error);
      return res.status(500).json({ error: 'Failed to translate text' });
    }
  }
}
