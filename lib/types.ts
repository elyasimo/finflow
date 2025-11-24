// Common types used across the application

export interface User {
  id: string;
  email: string;
  fullName?: string;
  defaultCurrency?: string;
}

export interface Account {
  id: string;
  name: string;
  nameTranslations?: {
    en?: string;
    de?: string;
    fr?: string;
    ar?: string;
  };
  type: string;
  currency: string;
  balance: string | number; // Can be a string from API (Decimal) or number
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  budgetId?: string;
  userId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: string | number; // Can be a string from API (Decimal) or number
  currency: string;
  description?: string;
  descriptionTranslations?: {
    en?: string;
    de?: string;
    fr?: string;
    ar?: string;
  };
  categoryId?: string;
  category?: Category;
  account?: {
    id: string;
    name: string;
    type: string;
  };
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  name: string;
  nameTranslations?: {
    en?: string;
    de?: string;
    fr?: string;
    ar?: string;
  };
  amount: string | number; // Can be a string from API (Decimal) or number
  currency: string;
  categoryId?: string;
  startDate: string;
  endDate: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountData {
  name: string;
  type: string;
  currency?: string;
  balance?: number;
}

export interface UpdateAccountData {
  name?: string;
  type?: string;
  currency?: string;
  openingBalanceCents?: number;
}

export interface CreateTransactionData {
  accountId: string;
  budgetId?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency?: string;
  description?: string;
  categoryId?: string;
  transactionDate: Date;
}

export interface UpdateTransactionData {
  accountId?: string;
  budgetId?: string;
  type?: 'income' | 'expense' | 'transfer';
  amount?: number;
  currency?: string;
  description?: string;
  categoryId?: string;
  transactionDate?: Date;
}

export interface CreateBudgetData {
  name: string;
  amount: number;
  currency?: string;
  period?: 'monthly' | 'quarterly' | 'yearly';
  categoryId?: string;
  startDate: Date;
  endDate: Date;
}

export interface UpdateBudgetData {
  name?: string;
  amount?: number;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ProfileUpdateData {
  fullName?: string;
  email?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  nameTranslations?: {
    en?: string;
    de?: string;
    fr?: string;
    ar?: string;
  };
  createdAt: string;
  updatedAt: string;
}
