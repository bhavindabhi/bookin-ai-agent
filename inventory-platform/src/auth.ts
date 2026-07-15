import type { Request, Response, NextFunction } from "express";
import { prisma } from "./db.js";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

/**
 * Blocks access to everything except /setup, /login, and static assets until
 * logged in. Sends a first-time visitor to /setup instead of a /login page
 * for an account that doesn't exist yet.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.session.userId) {
    next();
    return;
  }
  const anyUser = await prisma.user.findFirst({ select: { id: true } });
  res.redirect(anyUser ? "/login" : "/setup");
}
