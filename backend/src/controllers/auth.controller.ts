import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db.js';
import { users, categories } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import type { AuthRequest } from '../middleware/auth.js';

// Default categories to create for new users
const DEFAULT_CATEGORIES = [
  // Ausgaben
  { name: 'Wohnen', icon: '🏠', color: '#3B82F6' },
  { name: 'Strom', icon: '⚡', color: '#EAB308' },
  { name: 'Wasser', icon: '💧', color: '#06B6D4' },
  { name: 'Internet & Telefon', icon: '📱', color: '#8B5CF6' },
  { name: 'Versicherung', icon: '🛡️', color: '#6366F1' },
  { name: 'Auto & Transport', icon: '🚗', color: '#F97316' },
  { name: 'Tanken', icon: '⛽', color: '#EF4444' },
  { name: 'Lebensmittel', icon: '🛒', color: '#22C55E' },
  { name: 'Restaurant & Café', icon: '🍽️', color: '#F59E0B' },
  { name: 'Gesundheit', icon: '🏥', color: '#EC4899' },
  { name: 'Fitness', icon: '💪', color: '#14B8A6' },
  { name: 'Kleidung', icon: '👕', color: '#A855F7' },
  { name: 'Freizeit & Hobby', icon: '🎮', color: '#06B6D4' },
  { name: 'Abonnements', icon: '📺', color: '#F43F5E' },
  { name: 'Bildung', icon: '📚', color: '#3B82F6' },
  { name: 'Geschenke', icon: '🎁', color: '#D946EF' },
  { name: 'Haustiere', icon: '🐕', color: '#84CC16' },
  { name: 'Reisen', icon: '✈️', color: '#0EA5E9' },
  { name: 'Sonstiges', icon: '📦', color: '#6B7280' },
  // Einnahmen
  { name: 'Gehalt', icon: '💰', color: '#10B981' },
  { name: 'Nebeneinkommen', icon: '💵', color: '#34D399' },
  { name: 'Investments', icon: '📈', color: '#059669' },
  { name: 'Rückerstattung', icon: '↩️', color: '#6EE7B7' },
];

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = registerSchema.parse(req.body);

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        res.status(400).json({ error: 'Email already registered' });
        return;
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({ email, passwordHash })
        .returning({
          id: users.id,
          email: users.email,
          createdAt: users.createdAt,
        });

      // Create default categories for the new user
      try {
        await db.insert(categories).values(
          DEFAULT_CATEGORIES.map(cat => ({
            userId: newUser.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
          }))
        );
      } catch (categoryError) {
        console.error('Error creating default categories:', categoryError);
        // Don't fail registration if categories fail
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: newUser.id },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      );

      res.status(201).json({
        user: newUser,
        accessToken: token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      console.error('Register error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
        accessToken: token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.userId!),
        columns: {
          id: true,
          email: true,
          defaultCurrency: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Ensure camelCase for frontend
      const response = {
        id: user.id,
        email: user.email,
        defaultCurrency: user.defaultCurrency,
        createdAt: user.createdAt,
      };
      
      console.log('GetMe response:', response);
      res.json(response);
    } catch (error) {
      console.error('GetMe error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updatePreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { defaultCurrency } = req.body;

      // Validate currency
      const validCurrencies = ['EUR', 'CHF', 'USD', 'MAD'];
      if (defaultCurrency && !validCurrencies.includes(defaultCurrency)) {
        res.status(400).json({
          error: 'Invalid currency',
          message: `Currency must be one of: ${validCurrencies.join(', ')}`
        });
        return;
      }

      const [updatedUser] = await db
        .update(users)
        .set({ defaultCurrency })
        .where(eq(users.id, req.userId!))
        .returning({
          id: users.id,
          email: users.email,
          defaultCurrency: users.defaultCurrency,
          createdAt: users.createdAt,
        });

      res.json(updatedUser);
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current password and new password are required' });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({ error: 'New password must be at least 8 characters long' });
        return;
      }

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.userId!),
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

      if (!isValid) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, req.userId!));

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async seedDefaultCategories(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Check if user already has categories
      const existingCategories = await db.query.categories.findMany({
        where: eq(categories.userId, req.userId!),
      });

      if (existingCategories.length > 0) {
        res.status(400).json({
          error: 'Categories already exist',
          message: 'You already have categories. Delete them first if you want to reset to defaults.',
          existingCount: existingCategories.length
        });
        return;
      }

      // Create default categories
      const createdCategories = await db.insert(categories).values(
        DEFAULT_CATEGORIES.map(cat => ({
          userId: req.userId!,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
        }))
      ).returning();

      res.status(201).json({
        message: `Successfully created ${createdCategories.length} default categories`,
        categories: createdCategories
      });
    } catch (error) {
      console.error('Seed categories error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
