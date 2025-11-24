import { Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { categories } from '../../drizzle/schema.js';
import { eq, and } from 'drizzle-orm';
import type { AuthRequest } from '../middleware/auth.js';

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const updateCategorySchema = createCategorySchema.partial();

export class CategoriesController {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await db.query.categories.findMany({
        where: eq(categories.userId, req.userId!),
        orderBy: (categories, { asc }) => [asc(categories.name)],
      });

      res.json(result);
    } catch (error) {
      console.error('List categories error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const category = await db.query.categories.findFirst({
        where: and(eq(categories.id, id), eq(categories.userId, req.userId!)),
      });

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      res.json(category);
    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = createCategorySchema.parse(req.body);

      const [category] = await db
        .insert(categories)
        .values({
          ...data,
          userId: req.userId!,
        })
        .returning();

      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = updateCategorySchema.parse(req.body);

      const [category] = await db
        .update(categories)
        .set(data)
        .where(and(eq(categories.id, id), eq(categories.userId, req.userId!)))
        .returning();

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      console.error('Update category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const [category] = await db
        .delete(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, req.userId!)))
        .returning();

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
