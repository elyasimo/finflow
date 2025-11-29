import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user is an admin
 */
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};
