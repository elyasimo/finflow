import { pgTable, uuid, text, timestamp, bigint, boolean, jsonb, integer, numeric, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role').notNull().default('user'), // 'user', 'admin'
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  publicKey: text('public_key'),
  defaultCurrency: text('default_currency').notNull().default('EUR'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Refresh Tokens table for secure token refresh
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isRevoked: boolean('is_revoked').notNull().default(false),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
  tokenIdx: index('refresh_tokens_token_idx').on(table.token),
}));

// Accounts table
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  nameTranslations: jsonb('name_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
  type: text('type').notNull(), // cash, bank, creditCard, investment, crypto
  currency: text('currency').notNull(),
  openingBalanceCents: bigint('opening_balance_cents', { mode: 'number' }).notNull().default(0),
  color: text('color'),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  nameTranslations: jsonb('name_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
  parentId: uuid('parent_id'),
  icon: text('icon'),
  color: text('color'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('categories_user_id_idx').on(table.userId),
}));

// Transactions table
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // income, expense, transfer
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  currency: text('currency').notNull(),
  fxRate: numeric('fx_rate', { precision: 18, scale: 8 }).notNull().default('1.0'),
  date: timestamp('date', { withTimezone: true }).notNull(),
  description: text('description'),
  descriptionTranslations: jsonb('description_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
  notes: text('notes'),
  notesTranslations: jsonb('notes_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
  attachmentRefs: text('attachment_refs').array(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  tags: text('tags').array().default([]),
  splitParentId: uuid('split_parent_id'),
  toAccountId: uuid('to_account_id').references(() => accounts.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  userIdIdx: index('transactions_user_id_idx').on(table.userId),
  accountIdIdx: index('transactions_account_id_idx').on(table.accountId),
  dateIdx: index('transactions_date_idx').on(table.date),
  categoryIdIdx: index('transactions_category_id_idx').on(table.categoryId),
  typeIdx: index('transactions_type_idx').on(table.type),
}));

// Budgets table
export const budgets = pgTable('budgets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name'),
  nameTranslations: jsonb('name_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
  period: text('period').notNull(), // monthly, quarterly, yearly
  amountCents: bigint('amount_cents', { mode: 'number' }).notNull(),
  currency: text('currency').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  rollover: boolean('rollover').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('budgets_user_id_idx').on(table.userId),
  categoryIdIdx: index('budgets_category_id_idx').on(table.categoryId),
}));

// Holdings table (investments)
export const holdings = pgTable('holdings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  symbol: text('symbol').notNull(),
  quantity: numeric('quantity', { precision: 28, scale: 10 }).notNull(),
  avgCostCents: bigint('avg_cost_cents', { mode: 'number' }).notNull(),
  currency: text('currency').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('holdings_user_id_idx').on(table.userId),
  symbolIdx: index('holdings_symbol_idx').on(table.symbol),
}));

// Prices table (cached price data)
export const prices = pgTable('prices', {
  id: uuid('id').defaultRandom().primaryKey(),
  symbol: text('symbol').notNull(),
  price: numeric('price', { precision: 28, scale: 10 }).notNull(),
  currency: text('currency').notNull(),
  source: text('source').notNull(), // yahoo, alphavantage
  asOf: timestamp('as_of', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  symbolCurrencyIdx: index('prices_symbol_currency_idx').on(table.symbol, table.currency),
}));

// Rules table (auto-categorization)
export const rules = pgTable('rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  nameTranslations: jsonb('name_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
  conditions: jsonb('conditions').notNull(),
  actions: jsonb('actions').notNull(),
  priority: integer('priority').notNull().default(0),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Attachments table
export const attachments = pgTable('attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }),
  storageRef: text('storage_ref').notNull(),
  mimeType: text('mime_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  checksum: text('checksum'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Goals table
export const goals = pgTable('goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  nameTranslations: jsonb('name_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
  targetAmountCents: bigint('target_amount_cents', { mode: 'number' }).notNull(),
  currency: text('currency').notNull(),
  targetDate: timestamp('target_date').notNull(),
  notes: text('notes'),
  notesTranslations: jsonb('notes_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
  progressAuto: boolean('progress_auto').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Trading Agent Configuration table
export const tradingAgents = pgTable('trading_agents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  nameTranslations: jsonb('name_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
  enabled: boolean('enabled').notNull().default(false),
  assets: text('assets').array().notNull(), // ['BTC', 'ETH', 'SOL']
  strategy: text('strategy').notNull().default('conservative'), // conservative, moderate, aggressive

  // Risk management settings
  stopLossPercent: numeric('stop_loss_percent', { precision: 5, scale: 2 }).notNull().default('8.0'),
  takeProfitPercent: numeric('take_profit_percent', { precision: 5, scale: 2 }).notNull().default('15.0'),
  trailingStopPercent: numeric('trailing_stop_percent', { precision: 5, scale: 2 }),
  maxDailyTradesCents: bigint('max_daily_trades_cents', { mode: 'number' }).notNull().default(10000), // €100 default
  maxSingleTradeCents: bigint('max_single_trade_cents', { mode: 'number' }).notNull().default(5000), // €50 default

  // Entry prices for stop-loss calculation
  entryPrices: jsonb('entry_prices'), // { BTC: 85000, ETH: 3200, SOL: 150 }

  // Stats
  totalTradesExecuted: integer('total_trades_executed').notNull().default(0),
  totalProfitCents: bigint('total_profit_cents', { mode: 'number' }).notNull().default(0),
  lastTradeAt: timestamp('last_trade_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Trading Agent Logs table
export const tradingLogs = pgTable('trading_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentId: uuid('agent_id').references(() => tradingAgents.id, { onDelete: 'cascade' }).notNull(),
  action: text('action').notNull(), // buy, sell, stop_loss, take_profit, error
  asset: text('asset').notNull(),
  quantity: numeric('quantity', { precision: 28, scale: 10 }),
  priceAtAction: numeric('price_at_action', { precision: 28, scale: 10 }),
  totalValueCents: bigint('total_value_cents', { mode: 'number' }),
  reason: text('reason').notNull(),
  orderId: text('order_id'), // Binance order ID
  status: text('status').notNull().default('pending'), // pending, executed, failed, cancelled
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Encrypted API Keys table
export const encryptedApiKeys = pgTable('encrypted_api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(), // 'binance', 'alpaca', etc.
  apiKeyEncrypted: text('api_key_encrypted').notNull(),
  apiKeyIv: text('api_key_iv').notNull(),
  apiKeyTag: text('api_key_tag').notNull(),
  apiSecretEncrypted: text('api_secret_encrypted').notNull(),
  apiSecretIv: text('api_secret_iv').notNull(),
  apiSecretTag: text('api_secret_tag').notNull(),
  permissions: jsonb('permissions'), // Optional: store what permissions this key has
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Price Alerts table
export const priceAlerts = pgTable('price_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  asset: text('asset').notNull(),
  alertType: text('alert_type').notNull(), // 'above', 'below'
  targetPrice: numeric('target_price', { precision: 28, scale: 10 }).notNull(),
  currentPrice: numeric('current_price', { precision: 28, scale: 10 }),
  isActive: boolean('is_active').notNull().default(true),
  triggeredAt: timestamp('triggered_at', { withTimezone: true }),
  notificationSent: boolean('notification_sent').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// OTP Verification table
export const otpVerifications = pgTable('otp_verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  type: text('type').notNull(), // 'email', 'sms'
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  verified: boolean('verified').notNull().default(false),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  transactions: many(transactions),
  categories: many(categories),
  budgets: many(budgets),
  holdings: many(holdings),
  rules: many(rules),
  goals: many(goals),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  transactions: many(transactions),
  holdings: many(holdings),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
  toAccount: one(accounts, { fields: [transactions.toAccountId], references: [accounts.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
}));
