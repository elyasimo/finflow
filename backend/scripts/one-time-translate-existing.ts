// @ts-nocheck
/**
 * One-time script to translate existing database content
 * Run this once to translate all your existing budgets, accounts, categories
 *
 * Usage: docker-compose exec api npx tsx scripts/one-time-translate-existing.ts
 */

import { db } from '../src/db.js';
import { autoTranslate } from '../src/services/auto-translate.service.js';
import { accounts, budgets, categories } from '../drizzle/schema.js';

async function main() {
  console.log('🚀 Starting one-time translation of existing data...\n');

  try {
    // Translate Budgets
    console.log('[1/3] Translating Budgets...');
    const allBudgets = await db.select().from(budgets);
    let budgetCount = 0;

    for (const budget of allBudgets) {
      if (!budget.name || budget.nameTranslations) {
        continue; // Skip if no name or already translated
      }

      console.log(`  Translating: "${budget.name}"`);
      const translations = await autoTranslate(budget.name);

      await db
        .update(budgets)
        .set({ nameTranslations: translations })
        .where(db.select().from(budgets).where(budgets.id.eq(budget.id)));

      budgetCount++;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✓ Translated ${budgetCount} budgets\n`);

    // Translate Accounts
    console.log('[2/3] Translating Accounts...');
    const allAccounts = await db.select().from(accounts);
    let accountCount = 0;

    for (const account of allAccounts) {
      if (!account.name || account.nameTranslations) {
        continue;
      }

      console.log(`  Translating: "${account.name}"`);
      const translations = await autoTranslate(account.name);

      await db
        .update(accounts)
        .set({ nameTranslations: translations })
        .where(db.select().from(accounts).where(accounts.id.eq(account.id)));

      accountCount++;

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✓ Translated ${accountCount} accounts\n`);

    // Translate Categories
    console.log('[3/3] Translating Categories...');
    const allCategories = await db.select().from(categories);
    let categoryCount = 0;

    for (const category of allCategories) {
      if (!category.name || category.nameTranslations) {
        continue;
      }

      console.log(`  Translating: "${category.name}"`);
      const translations = await autoTranslate(category.name);

      await db
        .update(categories)
        .set({ nameTranslations: translations })
        .where(db.select().from(categories).where(categories.id.eq(category.id)));

      categoryCount++;

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✓ Translated ${categoryCount} categories\n`);

    console.log('✅ Translation complete!');
    console.log(`📊 Summary: ${budgetCount} budgets, ${accountCount} accounts, ${categoryCount} categories`);

  } catch (error) {
    console.error('❌ Error during translation:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
