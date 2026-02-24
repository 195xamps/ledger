import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { z } from "zod";
import {
  requireAuth,
  optionalAuth,
  setSessionCookie,
  clearSessionCookie,
} from "./auth";
import {
  createUser,
  getUserByUsername,
  getUserById,
  verifyPassword,
  createSession,
  deleteSession,
  updateUserPreferences,
  getFacts,
  getFactById,
  getTrendingFacts,
  getDisputedFacts,
  searchFacts,
  getCategoryStats,
  toggleBookmark,
  getUserBookmarks,
  toggleMute,
  createFact,
  addRevision,
  linkRelatedFacts,
} from "./storage";
import {
  insertUserSchema,
  categoryEnum,
  importanceEnum,
  confidenceEnum,
  sourceTierEnum,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // ========================================================================
  // AUTH
  // ========================================================================

  app.post("/api/auth/register", async (req, res) => {
    try {
      const body = insertUserSchema.parse(req.body);

      const existing = await getUserByUsername(body.username);
      if (existing) {
        return res.status(409).json({ error: "Username already taken" });
      }

      const user = await createUser(body);
      const { token, expiresAt } = await createSession(user.id);

      setSessionCookie(res, token, expiresAt);

      return res.status(201).json({
        id: user.id,
        username: user.username,
        preferences: user.preferences,
        token, // also return token for mobile clients
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: err.errors });
      }
      console.error("Register error:", err);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await verifyPassword(user, password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const { token, expiresAt } = await createSession(user.id);
      setSessionCookie(res, token, expiresAt);

      return res.json({
        id: user.id,
        username: user.username,
        preferences: user.preferences,
        token,
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    try {
      const token =
        req.cookies?.ledger_session ||
        req.headers.authorization?.slice(7);

      if (token) {
        await deleteSession(token);
      }

      clearSessionCookie(res);
      return res.json({ ok: true });
    } catch (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await getUserById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        preferences: user.preferences,
        createdAt: user.createdAt,
      });
    } catch (err) {
      console.error("Me error:", err);
      return res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.patch("/api/auth/preferences", requireAuth, async (req, res) => {
    try {
      const prefsSchema = z
        .object({
          notificationLevel: z
            .enum(["breaking", "high", "all", "none"])
            .optional(),
          displayDensity: z.enum(["expanded", "compact"]).optional(),
          sourceTiers: z.array(sourceTierEnum).optional(),
        })
        .strict();

      const prefs = prefsSchema.parse(req.body);
      const user = await updateUserPreferences(req.userId!, prefs);

      return res.json({ preferences: user.preferences });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid preferences", details: err.errors });
      }
      console.error("Preferences error:", err);
      return res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // ========================================================================
  // FACTS — READ
  // ========================================================================

  app.get("/api/facts", optionalAuth, async (req, res) => {
    try {
      const querySchema = z.object({
        category: categoryEnum.optional(),
        importance: importanceEnum.optional(),
        confidence: confidenceEnum.optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
        offset: z.coerce.number().min(0).optional(),
      });

      const query = querySchema.parse(req.query);
      const result = await getFacts({ ...query, userId: req.userId });

      return res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid query", details: err.errors });
      }
      console.error("Get facts error:", err);
      return res.status(500).json({ error: "Failed to fetch facts" });
    }
  });

  app.get("/api/facts/trending", optionalAuth, async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 5, 20);
      const trending = await getTrendingFacts(limit, req.userId);
      return res.json({ facts: trending });
    } catch (err) {
      console.error("Trending error:", err);
      return res.status(500).json({ error: "Failed to fetch trending" });
    }
  });

  app.get("/api/facts/disputed", optionalAuth, async (req, res) => {
    try {
      const disputed = await getDisputedFacts(req.userId);
      return res.json({ facts: disputed });
    } catch (err) {
      console.error("Disputed error:", err);
      return res.status(500).json({ error: "Failed to fetch disputed" });
    }
  });

  // IMPORTANT: This route must come AFTER /api/facts/trending and /api/facts/disputed
  // so those paths don't get matched as :id
  app.get("/api/facts/:id", optionalAuth, async (req, res) => {
    try {
      const fact = await getFactById(req.params.id, req.userId);
      if (!fact) {
        return res.status(404).json({ error: "Fact not found" });
      }
      return res.json(fact);
    } catch (err) {
      console.error("Get fact error:", err);
      return res.status(500).json({ error: "Failed to fetch fact" });
    }
  });

  // ========================================================================
  // SEARCH
  // ========================================================================

  app.get("/api/search", optionalAuth, async (req, res) => {
    try {
      const q = String(req.query.q || "").trim();
      if (!q) {
        return res.status(400).json({ error: "Search query required" });
      }

      const results = await searchFacts(q, req.userId);
      return res.json({ facts: results, query: q });
    } catch (err) {
      console.error("Search error:", err);
      return res.status(500).json({ error: "Search failed" });
    }
  });

  // ========================================================================
  // CATEGORIES
  // ========================================================================

  app.get("/api/categories", async (_req, res) => {
    try {
      const stats = await getCategoryStats();
      return res.json({ categories: stats });
    } catch (err) {
      console.error("Categories error:", err);
      return res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // ========================================================================
  // BOOKMARKS
  // ========================================================================

  app.get("/api/bookmarks", requireAuth, async (req, res) => {
    try {
      const bookmarked = await getUserBookmarks(req.userId!);
      return res.json({ facts: bookmarked });
    } catch (err) {
      console.error("Bookmarks error:", err);
      return res.status(500).json({ error: "Failed to fetch bookmarks" });
    }
  });

  app.post("/api/bookmarks/:factId", requireAuth, async (req, res) => {
    try {
      const result = await toggleBookmark(req.userId!, req.params.factId);
      return res.json(result);
    } catch (err) {
      console.error("Toggle bookmark error:", err);
      return res.status(500).json({ error: "Failed to toggle bookmark" });
    }
  });

  // ========================================================================
  // MUTE
  // ========================================================================

  app.post("/api/mute/:factId", requireAuth, async (req, res) => {
    try {
      const result = await toggleMute(req.userId!, req.params.factId);
      return res.json(result);
    } catch (err) {
      console.error("Toggle mute error:", err);
      return res.status(500).json({ error: "Failed to toggle mute" });
    }
  });

  // ========================================================================
  // FACTS — WRITE (admin / ingestion endpoints)
  // These will be called by the ingestion pipeline, not by regular users.
  // For now, they require auth. Later, lock to admin role.
  // ========================================================================

  app.post("/api/admin/facts", requireAuth, async (req, res) => {
    try {
      const bodySchema = z.object({
        headline: z.string().min(1),
        currentValue: z.string().min(1),
        category: categoryEnum,
        importance: importanceEnum.default("medium"),
        confidence: confidenceEnum.default("developing"),
        tags: z.array(z.string()).default([]),
        revision: z.object({
          previousValue: z.string().nullable().optional(),
          newValue: z.string(),
          delta: z.string(),
          whyItMatters: z.string(),
          revisionType: z.enum([
            "initial",
            "update",
            "correction",
            "escalation",
            "resolution",
          ]).default("initial"),
          sourceName: z.string(),
          sourceUrl: z.string().optional(),
          sourceTier: sourceTierEnum.default("reporting"),
        }),
        sources: z
          .array(
            z.object({
              name: z.string(),
              url: z.string().optional(),
              tier: z.string().default("reporting"),
            })
          )
          .min(1),
      });

      const body = bodySchema.parse(req.body);

      const fact = await createFact(
        {
          headline: body.headline,
          currentValue: body.currentValue,
          category: body.category,
          importance: body.importance,
          confidence: body.confidence,
          tags: body.tags,
          lastUpdated: new Date(),
        },
        {
          ...body.revision,
          previousValue: body.revision.previousValue ?? null,
          sourceUrl: body.revision.sourceUrl ?? null,
          timestamp: new Date(),
        },
        body.sources
      );

      return res.status(201).json(fact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid fact data", details: err.errors });
      }
      console.error("Create fact error:", err);
      return res.status(500).json({ error: "Failed to create fact" });
    }
  });

  app.post("/api/admin/facts/:id/revisions", requireAuth, async (req, res) => {
    try {
      const bodySchema = z.object({
        previousValue: z.string().nullable().optional(),
        newValue: z.string(),
        delta: z.string(),
        whyItMatters: z.string(),
        revisionType: z.enum([
          "initial",
          "update",
          "correction",
          "escalation",
          "resolution",
        ]).default("update"),
        sourceName: z.string(),
        sourceUrl: z.string().optional(),
        sourceTier: sourceTierEnum.default("reporting"),
        // Optionally update the fact's top-level fields
        newCurrentValue: z.string().optional(),
        newConfidence: confidenceEnum.optional(),
        newImportance: importanceEnum.optional(),
      });

      const body = bodySchema.parse(req.body);
      const factId = req.params.id;

      // Check fact exists
      const existing = await getFactById(factId);
      if (!existing) {
        return res.status(404).json({ error: "Fact not found" });
      }

      const updated = await addRevision(
        factId,
        {
          previousValue: body.previousValue ?? null,
          newValue: body.newValue,
          delta: body.delta,
          whyItMatters: body.whyItMatters,
          revisionType: body.revisionType,
          sourceName: body.sourceName,
          sourceUrl: body.sourceUrl ?? null,
          sourceTier: body.sourceTier,
          timestamp: new Date(),
        },
        body.newCurrentValue,
        body.newConfidence,
        body.newImportance
      );

      return res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid revision data", details: err.errors });
      }
      console.error("Add revision error:", err);
      return res.status(500).json({ error: "Failed to add revision" });
    }
  });

  app.post("/api/admin/facts/:id/link", requireAuth, async (req, res) => {
    try {
      const { relatedFactId } = z
        .object({ relatedFactId: z.string().uuid() })
        .parse(req.body);

      await linkRelatedFacts(req.params.id, relatedFactId);
      return res.json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: err.errors });
      }
      console.error("Link facts error:", err);
      return res.status(500).json({ error: "Failed to link facts" });
    }
  });

  // ========================================================================
  // HEALTH
  // ========================================================================

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
