import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

// Augment Express Request to have properly typed user
declare global {
  namespace Express {
    interface User extends User {}
  }
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized: Please login to access this resource' });
};

// Middleware to check if user has specific role
export const hasRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized: Please login to access this resource' });
    }
    
    const userRole = req.user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource' });
    }
    
    next();
  };
};

// Admin-only middleware
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized: Please login to access this resource' });
  }
  
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  
  next();
};

// Webhook authentication middleware
export const validateWebhookSecret = (source: 'hostai' | 'suiteop') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // For HostAI, if no secret is defined in env, we don't enforce authentication
    if (source === 'hostai' && !process.env.HOSTAI_WEBHOOK_SECRET) {
      return next();
    }
    
    const webhookSecret = req.headers['x-webhook-secret'];
    const configSecret = source === 'hostai' 
      ? process.env.HOSTAI_WEBHOOK_SECRET 
      : process.env.SUITEOP_WEBHOOK_SECRET;
    
    // Check query parameter if header is not available (less secure, but sometimes necessary)
    const querySecret = req.query.key as string;
    
    if ((!webhookSecret && !querySecret) || 
        (webhookSecret !== configSecret && querySecret !== configSecret)) {
      return res.status(401).json({ message: 'Invalid webhook secret' });
    }
    
    next();
  };
};
