"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesRelations = exports.transactionsRelations = exports.accountsRelations = exports.usersRelations = exports.encryptedApiKeys = exports.tradingLogs = exports.tradingAgents = exports.goals = exports.attachments = exports.rules = exports.prices = exports.holdings = exports.budgets = exports.transactions = exports.categories = exports.accounts = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
// Users table
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    publicKey: (0, pg_core_1.text)('public_key'),
    defaultCurrency: (0, pg_core_1.text)('default_currency').notNull().default('EUR'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
// Accounts table
exports.accounts = (0, pg_core_1.pgTable)('accounts', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    nameTranslations: (0, pg_core_1.jsonb)('name_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
    type: (0, pg_core_1.text)('type').notNull(), // cash, bank, creditCard, investment, crypto
    currency: (0, pg_core_1.text)('currency').notNull(),
    openingBalanceCents: (0, pg_core_1.bigint)('opening_balance_cents', { mode: 'number' }).notNull().default(0),
    color: (0, pg_core_1.text)('color'),
    archived: (0, pg_core_1.boolean)('archived').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Categories table
exports.categories = (0, pg_core_1.pgTable)('categories', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    nameTranslations: (0, pg_core_1.jsonb)('name_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
    parentId: (0, pg_core_1.uuid)('parent_id'),
    icon: (0, pg_core_1.text)('icon'),
    color: (0, pg_core_1.text)('color'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
// Transactions table
exports.transactions = (0, pg_core_1.pgTable)('transactions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    accountId: (0, pg_core_1.uuid)('account_id').references(() => exports.accounts.id, { onDelete: 'cascade' }).notNull(),
    type: (0, pg_core_1.text)('type').notNull(), // income, expense, transfer
    amountCents: (0, pg_core_1.bigint)('amount_cents', { mode: 'number' }).notNull(),
    currency: (0, pg_core_1.text)('currency').notNull(),
    fxRate: (0, pg_core_1.numeric)('fx_rate', { precision: 18, scale: 8 }).notNull().default('1.0'),
    date: (0, pg_core_1.timestamp)('date', { withTimezone: true }).notNull(),
    description: (0, pg_core_1.text)('description'),
    descriptionTranslations: (0, pg_core_1.jsonb)('description_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
    notes: (0, pg_core_1.text)('notes'),
    notesTranslations: (0, pg_core_1.jsonb)('notes_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
    attachmentRefs: (0, pg_core_1.text)('attachment_refs').array(),
    categoryId: (0, pg_core_1.uuid)('category_id').references(() => exports.categories.id, { onDelete: 'set null' }),
    tags: (0, pg_core_1.text)('tags').array().default([]),
    splitParentId: (0, pg_core_1.uuid)('split_parent_id'),
    toAccountId: (0, pg_core_1.uuid)('to_account_id').references(() => exports.accounts.id, { onDelete: 'set null' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at', { withTimezone: true }),
});
// Budgets table
exports.budgets = (0, pg_core_1.pgTable)('budgets', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    categoryId: (0, pg_core_1.uuid)('category_id').references(() => exports.categories.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name'),
    nameTranslations: (0, pg_core_1.jsonb)('name_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
    period: (0, pg_core_1.text)('period').notNull(), // monthly, quarterly, yearly
    amountCents: (0, pg_core_1.bigint)('amount_cents', { mode: 'number' }).notNull(),
    currency: (0, pg_core_1.text)('currency').notNull(),
    startDate: (0, pg_core_1.timestamp)('start_date', { withTimezone: true }),
    endDate: (0, pg_core_1.timestamp)('end_date', { withTimezone: true }),
    rollover: (0, pg_core_1.boolean)('rollover').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Holdings table (investments)
exports.holdings = (0, pg_core_1.pgTable)('holdings', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    accountId: (0, pg_core_1.uuid)('account_id').references(() => exports.accounts.id, { onDelete: 'cascade' }).notNull(),
    symbol: (0, pg_core_1.text)('symbol').notNull(),
    quantity: (0, pg_core_1.numeric)('quantity', { precision: 28, scale: 10 }).notNull(),
    avgCostCents: (0, pg_core_1.bigint)('avg_cost_cents', { mode: 'number' }).notNull(),
    currency: (0, pg_core_1.text)('currency').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Prices table (cached price data)
exports.prices = (0, pg_core_1.pgTable)('prices', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    symbol: (0, pg_core_1.text)('symbol').notNull(),
    price: (0, pg_core_1.numeric)('price', { precision: 28, scale: 10 }).notNull(),
    currency: (0, pg_core_1.text)('currency').notNull(),
    source: (0, pg_core_1.text)('source').notNull(), // yahoo, alphavantage
    asOf: (0, pg_core_1.timestamp)('as_of', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
// Rules table (auto-categorization)
exports.rules = (0, pg_core_1.pgTable)('rules', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    nameTranslations: (0, pg_core_1.jsonb)('name_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
    conditions: (0, pg_core_1.jsonb)('conditions').notNull(),
    actions: (0, pg_core_1.jsonb)('actions').notNull(),
    priority: (0, pg_core_1.integer)('priority').notNull().default(0),
    enabled: (0, pg_core_1.boolean)('enabled').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
// Attachments table
exports.attachments = (0, pg_core_1.pgTable)('attachments', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    transactionId: (0, pg_core_1.uuid)('transaction_id').references(() => exports.transactions.id, { onDelete: 'cascade' }),
    storageRef: (0, pg_core_1.text)('storage_ref').notNull(),
    mimeType: (0, pg_core_1.text)('mime_type').notNull(),
    size: (0, pg_core_1.bigint)('size', { mode: 'number' }).notNull(),
    checksum: (0, pg_core_1.text)('checksum'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
// Goals table
exports.goals = (0, pg_core_1.pgTable)('goals', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    nameTranslations: (0, pg_core_1.jsonb)('name_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
    targetAmountCents: (0, pg_core_1.bigint)('target_amount_cents', { mode: 'number' }).notNull(),
    currency: (0, pg_core_1.text)('currency').notNull(),
    targetDate: (0, pg_core_1.timestamp)('target_date').notNull(),
    notes: (0, pg_core_1.text)('notes'),
    notesTranslations: (0, pg_core_1.jsonb)('notes_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
    progressAuto: (0, pg_core_1.boolean)('progress_auto').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Trading Agent Configuration table
exports.tradingAgents = (0, pg_core_1.pgTable)('trading_agents', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    nameTranslations: (0, pg_core_1.jsonb)('name_translations'), // { en: "...", de: "...", fr: "...", ar: "..." }
    enabled: (0, pg_core_1.boolean)('enabled').notNull().default(false),
    assets: (0, pg_core_1.text)('assets').array().notNull(), // ['BTC', 'ETH', 'SOL']
    strategy: (0, pg_core_1.text)('strategy').notNull().default('conservative'), // conservative, moderate, aggressive
    // Risk management settings
    stopLossPercent: (0, pg_core_1.numeric)('stop_loss_percent', { precision: 5, scale: 2 }).notNull().default('8.0'),
    takeProfitPercent: (0, pg_core_1.numeric)('take_profit_percent', { precision: 5, scale: 2 }).notNull().default('15.0'),
    trailingStopPercent: (0, pg_core_1.numeric)('trailing_stop_percent', { precision: 5, scale: 2 }),
    maxDailyTradesCents: (0, pg_core_1.bigint)('max_daily_trades_cents', { mode: 'number' }).notNull().default(10000), // €100 default
    maxSingleTradeCents: (0, pg_core_1.bigint)('max_single_trade_cents', { mode: 'number' }).notNull().default(5000), // €50 default
    // Entry prices for stop-loss calculation
    entryPrices: (0, pg_core_1.jsonb)('entry_prices'), // { BTC: 85000, ETH: 3200, SOL: 150 }
    // Stats
    totalTradesExecuted: (0, pg_core_1.integer)('total_trades_executed').notNull().default(0),
    totalProfitCents: (0, pg_core_1.bigint)('total_profit_cents', { mode: 'number' }).notNull().default(0),
    lastTradeAt: (0, pg_core_1.timestamp)('last_trade_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Trading Agent Logs table
exports.tradingLogs = (0, pg_core_1.pgTable)('trading_logs', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    agentId: (0, pg_core_1.uuid)('agent_id').references(() => exports.tradingAgents.id, { onDelete: 'cascade' }).notNull(),
    action: (0, pg_core_1.text)('action').notNull(), // buy, sell, stop_loss, take_profit, error
    asset: (0, pg_core_1.text)('asset').notNull(),
    quantity: (0, pg_core_1.numeric)('quantity', { precision: 28, scale: 10 }),
    priceAtAction: (0, pg_core_1.numeric)('price_at_action', { precision: 28, scale: 10 }),
    totalValueCents: (0, pg_core_1.bigint)('total_value_cents', { mode: 'number' }),
    reason: (0, pg_core_1.text)('reason').notNull(),
    orderId: (0, pg_core_1.text)('order_id'), // Binance order ID
    status: (0, pg_core_1.text)('status').notNull().default('pending'), // pending, executed, failed, cancelled
    errorMessage: (0, pg_core_1.text)('error_message'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
});
// Encrypted API Keys table
exports.encryptedApiKeys = (0, pg_core_1.pgTable)('encrypted_api_keys', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id, { onDelete: 'cascade' }).notNull(),
    provider: (0, pg_core_1.text)('provider').notNull(), // 'binance', 'alpaca', etc.
    apiKeyEncrypted: (0, pg_core_1.text)('api_key_encrypted').notNull(),
    apiKeyIv: (0, pg_core_1.text)('api_key_iv').notNull(),
    apiKeyTag: (0, pg_core_1.text)('api_key_tag').notNull(),
    apiSecretEncrypted: (0, pg_core_1.text)('api_secret_encrypted').notNull(),
    apiSecretIv: (0, pg_core_1.text)('api_secret_iv').notNull(),
    apiSecretTag: (0, pg_core_1.text)('api_secret_tag').notNull(),
    permissions: (0, pg_core_1.jsonb)('permissions'), // Optional: store what permissions this key has
    lastUsedAt: (0, pg_core_1.timestamp)('last_used_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Relations
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    accounts: many(exports.accounts),
    transactions: many(exports.transactions),
    categories: many(exports.categories),
    budgets: many(exports.budgets),
    holdings: many(exports.holdings),
    rules: many(exports.rules),
    goals: many(exports.goals),
}));
exports.accountsRelations = (0, drizzle_orm_1.relations)(exports.accounts, ({ one, many }) => ({
    user: one(exports.users, { fields: [exports.accounts.userId], references: [exports.users.id] }),
    transactions: many(exports.transactions),
    holdings: many(exports.holdings),
}));
exports.transactionsRelations = (0, drizzle_orm_1.relations)(exports.transactions, ({ one }) => ({
    user: one(exports.users, { fields: [exports.transactions.userId], references: [exports.users.id] }),
    account: one(exports.accounts, { fields: [exports.transactions.accountId], references: [exports.accounts.id] }),
    category: one(exports.categories, { fields: [exports.transactions.categoryId], references: [exports.categories.id] }),
    toAccount: one(exports.accounts, { fields: [exports.transactions.toAccountId], references: [exports.accounts.id] }),
}));
exports.categoriesRelations = (0, drizzle_orm_1.relations)(exports.categories, ({ one, many }) => ({
    user: one(exports.users, { fields: [exports.categories.userId], references: [exports.users.id] }),
    parent: one(exports.categories, { fields: [exports.categories.parentId], references: [exports.categories.id] }),
    children: many(exports.categories),
    transactions: many(exports.transactions),
    budgets: many(exports.budgets),
}));
//# sourceMappingURL=schema.js.map