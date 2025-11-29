import { Request, Response } from 'express';
import { db } from '../db';
import { users, accounts, transactions, budgets, categories, tradingAgents } from '../db/schema';
import { eq, desc, count, sql, like, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export class AdminController {
  /**
   * Get all users with pagination and search
   * GET /admin/users
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const offset = (page - 1) * limit;

      let whereClause = undefined;
      if (search) {
        whereClause = or(
          like(users.email, `%${search}%`),
          like(users.name, `%${search}%`)
        );
      }

      const [userList, totalResult] = await Promise.all([
        db.select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          isActive: users.isActive,
          defaultCurrency: users.defaultCurrency,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
        
        db.select({ count: count() })
          .from(users)
          .where(whereClause)
      ]);

      const total = totalResult[0]?.count || 0;

      res.json({
        users: userList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  /**
   * Get single user details with stats
   * GET /admin/users/:id
   */
  async getUserDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const [user] = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        defaultCurrency: users.defaultCurrency,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id));

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get user stats
      const [accountsCount] = await db.select({ count: count() })
        .from(accounts)
        .where(eq(accounts.userId, id));

      const [transactionsCount] = await db.select({ count: count() })
        .from(transactions)
        .where(eq(transactions.userId, id));

      const [budgetsCount] = await db.select({ count: count() })
        .from(budgets)
        .where(eq(budgets.userId, id));

      const [categoriesCount] = await db.select({ count: count() })
        .from(categories)
        .where(eq(categories.userId, id));

      const [agentsCount] = await db.select({ count: count() })
        .from(tradingAgents)
        .where(eq(tradingAgents.userId, id));

      res.json({
        user,
        stats: {
          accounts: accountsCount?.count || 0,
          transactions: transactionsCount?.count || 0,
          budgets: budgetsCount?.count || 0,
          categories: categoriesCount?.count || 0,
          tradingAgents: agentsCount?.count || 0,
        }
      });
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ error: 'Failed to fetch user details' });
    }
  }

  /**
   * Update user
   * PUT /admin/users/:id
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email, name, role, isActive, defaultCurrency, password } = req.body;
      const adminId = (req as any).user.id;

      // Prevent admin from deactivating themselves
      if (id === adminId && isActive === false) {
        res.status(400).json({ error: 'Cannot deactivate your own account' });
        return;
      }

      // Prevent admin from removing their own admin role
      if (id === adminId && role && role !== 'admin') {
        res.status(400).json({ error: 'Cannot remove your own admin role' });
        return;
      }

      const updateData: any = {};
      if (email !== undefined) updateData.email = email;
      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (defaultCurrency !== undefined) updateData.defaultCurrency = defaultCurrency;
      
      // If password is provided, hash it
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 12);
      }

      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          isActive: users.isActive,
          defaultCurrency: users.defaultCurrency,
          createdAt: users.createdAt,
        });

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user: updatedUser, message: 'User updated successfully' });
    } catch (error: any) {
      console.error('Error updating user:', error);
      if (error.code === '23505') {
        res.status(400).json({ error: 'Email already exists' });
        return;
      }
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  /**
   * Delete user
   * DELETE /admin/users/:id
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = (req as any).user.id;

      // Prevent admin from deleting themselves
      if (id === adminId) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
      }

      const [deletedUser] = await db.delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id, email: users.email });

      if (!deletedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ message: 'User deleted successfully', user: deletedUser });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  /**
   * Create new user (admin can create users)
   * POST /admin/users
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role = 'user', defaultCurrency = 'EUR' } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [newUser] = await db.insert(users)
        .values({
          email,
          passwordHash,
          name,
          role,
          defaultCurrency,
          isActive: true,
        } as any)
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          isActive: users.isActive,
          defaultCurrency: users.defaultCurrency,
          createdAt: users.createdAt,
        });

      res.status(201).json({ user: newUser, message: 'User created successfully' });
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.code === '23505') {
        res.status(400).json({ error: 'Email already exists' });
        return;
      }
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  /**
   * Get admin dashboard stats
   * GET /admin/stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const [totalUsers] = await db.select({ count: count() }).from(users);
      const [activeUsers] = await db.select({ count: count() })
        .from(users)
        .where(eq(users.isActive, true));
      const [adminUsers] = await db.select({ count: count() })
        .from(users)
        .where(eq(users.role, 'admin'));
      const [totalTransactions] = await db.select({ count: count() }).from(transactions);
      const [totalAccounts] = await db.select({ count: count() }).from(accounts);
      const [totalBudgets] = await db.select({ count: count() }).from(budgets);
      const [totalAgents] = await db.select({ count: count() }).from(tradingAgents);

      // Users registered in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const [newUsers] = await db.select({ count: count() })
        .from(users)
        .where(sql`${users.createdAt} > ${sevenDaysAgo}`);

      // Users registered in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const [monthlyUsers] = await db.select({ count: count() })
        .from(users)
        .where(sql`${users.createdAt} > ${thirtyDaysAgo}`);

      res.json({
        users: {
          total: totalUsers?.count || 0,
          active: activeUsers?.count || 0,
          admins: adminUsers?.count || 0,
          newThisWeek: newUsers?.count || 0,
          newThisMonth: monthlyUsers?.count || 0,
        },
        data: {
          transactions: totalTransactions?.count || 0,
          accounts: totalAccounts?.count || 0,
          budgets: totalBudgets?.count || 0,
          tradingAgents: totalAgents?.count || 0,
        }
      });
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  /**
   * Toggle user active status
   * POST /admin/users/:id/toggle-active
   */
  async toggleUserActive(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = (req as any).user.id;

      if (id === adminId) {
        res.status(400).json({ error: 'Cannot toggle your own account status' });
        return;
      }

      const [user] = await db.select({ isActive: users.isActive })
        .from(users)
        .where(eq(users.id, id));

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const [updatedUser] = await db.update(users)
        .set({ isActive: !user.isActive } as any)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          isActive: users.isActive,
        });

      res.json({ 
        user: updatedUser, 
        message: updatedUser.isActive ? 'User activated' : 'User deactivated' 
      });
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      res.status(500).json({ error: 'Failed to toggle user status' });
    }
  }

  /**
   * Promote user to admin
   * POST /admin/users/:id/make-admin
   */
  async makeAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const [updatedUser] = await db.update(users)
        .set({ role: 'admin' } as any)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
        });

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user: updatedUser, message: 'User promoted to admin' });
    } catch (error: any) {
      console.error('Error promoting user:', error);
      res.status(500).json({ error: 'Failed to promote user' });
    }
  }

  /**
   * Demote admin to user
   * POST /admin/users/:id/remove-admin
   */
  async removeAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = (req as any).user.id;

      if (id === adminId) {
        res.status(400).json({ error: 'Cannot remove your own admin role' });
        return;
      }

      const [updatedUser] = await db.update(users)
        .set({ role: 'user' } as any)
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
        });

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user: updatedUser, message: 'Admin role removed' });
    } catch (error: any) {
      console.error('Error demoting user:', error);
      res.status(500).json({ error: 'Failed to demote user' });
    }
  }
}

export const adminController = new AdminController();
