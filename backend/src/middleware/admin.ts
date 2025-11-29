import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user is an admin
 */
export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  
  next();
};
