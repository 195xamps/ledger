import type { Request, Response, NextFunction } from "express";
import { getSessionByToken } from "./storage";

// Extend Express Request to carry authenticated user ID
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const TOKEN_COOKIE = "ledger_session";

/**
 * Required auth — returns 401 if no valid session.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  getSessionByToken(token)
    .then((session) => {
      if (!session) {
        return res.status(401).json({ error: "Invalid or expired session" });
      }
      req.userId = session.userId;
      next();
    })
    .catch((err) => {
      console.error("Auth error:", err);
      return res.status(500).json({ error: "Authentication failed" });
    });
}

/**
 * Optional auth — attaches userId if valid session exists, continues regardless.
 * Use this for public endpoints that return extra data for logged-in users
 * (e.g., bookmark status on facts).
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  getSessionByToken(token)
    .then((session) => {
      if (session) {
        req.userId = session.userId;
      }
      next();
    })
    .catch(() => {
      // Silently continue without auth
      next();
    });
}

/**
 * Sets the session cookie on the response.
 */
export function setSessionCookie(
  res: Response,
  token: string,
  expiresAt: Date
) {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Clears the session cookie.
 */
export function clearSessionCookie(res: Response) {
  res.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
}

/**
 * Extracts token from cookie or Authorization header.
 */
function extractToken(req: Request): string | undefined {
  // Try cookie first
  const cookieToken = req.cookies?.[TOKEN_COOKIE];
  if (cookieToken) return cookieToken;

  // Fall back to Authorization header (for mobile / non-cookie clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return undefined;
}
