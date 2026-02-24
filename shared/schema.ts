import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  uuid,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ENUMS (stored as text, validated at app layer via zod)
// ============================================================================

export const categoryEnum = z.enum([
  "economy",
  "geopolitics",
  "technology",
  "science",
  "health",
  "climate",
  "legal",
  "security",
]);

export const importanceEnum = z.enum(["breaking", "high", "medium", "low"]);

export const confidenceEnum = z.enum([
  "confirmed",
  "developing",
  "disputed",
  "retracted",
]);

export const revisionTypeEnum = z.enum([
  "initial",
  "update",
  "correction",
  "escalation",
  "resolution",
]);

export const sourceTierEnum = z.enum([
  "primary",
  "wire",
  "reporting",
  "analysis",
]);

export type Category = z.infer<typeof categoryEnum>;
export type ImportanceLevel = z.infer<typeof importanceEnum>;
export type ConfidenceLevel = z.infer<typeof confidenceEnum>;
export type RevisionType = z.infer<typeof revisionTypeEnum>;
export type SourceTier = z.infer<typeof sourceTierEnum>;

// ============================================================================
// USERS
// ============================================================================

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  preferences: jsonb("preferences")
    .$type<{
      notificationLevel: "breaking" | "high" | "all" | "none";
      displayDensity: "expanded" | "compact";
      sourceTiers: SourceTier[];
    }>()
    .default({
      notificationLevel: "breaking",
      displayDensity: "expanded",
      sourceTiers: ["primary", "wire", "reporting"],
    }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ============================================================================
// SESSIONS
// ============================================================================

export const sessions = pgTable("sessions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// FACTS
// ============================================================================

export const facts = pgTable(
  "facts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    headline: text("headline").notNull(),
    currentValue: text("current_value").notNull(),
    category: text("category").notNull(), // validated via zod
    importance: text("importance").notNull().default("medium"),
    confidence: text("confidence").notNull().default("developing"),
    tags: jsonb("tags").$type<string[]>().default([]),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    index("idx_facts_category").on(table.category),
    index("idx_facts_importance").on(table.importance),
    index("idx_facts_confidence").on(table.confidence),
    index("idx_facts_last_updated").on(table.lastUpdated),
  ]
);

export const factsRelations = relations(facts, ({ many }) => ({
  revisions: many(factRevisions),
  factSources: many(factSources),
  relatedFrom: many(factRelations, { relationName: "relatedFrom" }),
  relatedTo: many(factRelations, { relationName: "relatedTo" }),
}));

export const insertFactSchema = createInsertSchema(facts, {
  category: categoryEnum,
  importance: importanceEnum,
  confidence: confidenceEnum,
}).omit({ id: true, createdAt: true });

export type InsertFact = z.infer<typeof insertFactSchema>;
export type Fact = typeof facts.$inferSelect;

// ============================================================================
// FACT REVISIONS (append-only)
// ============================================================================

export const factRevisions = pgTable(
  "fact_revisions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    factId: uuid("fact_id")
      .notNull()
      .references(() => facts.id, { onDelete: "cascade" }),
    previousValue: text("previous_value"),
    newValue: text("new_value").notNull(),
    delta: text("delta").notNull(),
    whyItMatters: text("why_it_matters").notNull(),
    revisionType: text("revision_type").notNull().default("update"),
    sourceName: text("source_name").notNull(),
    sourceUrl: text("source_url"),
    sourceTier: text("source_tier").notNull().default("reporting"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => [
    index("idx_revisions_fact_id").on(table.factId),
    index("idx_revisions_timestamp").on(table.timestamp),
  ]
);

export const factRevisionsRelations = relations(factRevisions, ({ one }) => ({
  fact: one(facts, {
    fields: [factRevisions.factId],
    references: [facts.id],
  }),
}));

export const insertRevisionSchema = createInsertSchema(factRevisions, {
  revisionType: revisionTypeEnum,
  sourceTier: sourceTierEnum,
}).omit({ id: true });

export type InsertRevision = z.infer<typeof insertRevisionSchema>;
export type FactRevision = typeof factRevisions.$inferSelect;

// ============================================================================
// SOURCES (normalized — one row per unique outlet)
// ============================================================================

export const sources = pgTable("sources", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  url: text("url"),
  tier: text("tier").notNull().default("reporting"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sourcesRelations = relations(sources, ({ many }) => ({
  factSources: many(factSources),
}));

export type Source = typeof sources.$inferSelect;

// ============================================================================
// FACT <-> SOURCE join table
// ============================================================================

export const factSources = pgTable(
  "fact_sources",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    factId: uuid("fact_id")
      .notNull()
      .references(() => facts.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    retrievedAt: timestamp("retrieved_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_fact_sources_unique").on(table.factId, table.sourceId),
  ]
);

export const factSourcesRelations = relations(factSources, ({ one }) => ({
  fact: one(facts, {
    fields: [factSources.factId],
    references: [facts.id],
  }),
  source: one(sources, {
    fields: [factSources.sourceId],
    references: [sources.id],
  }),
}));

// ============================================================================
// FACT RELATIONS (self-referencing many-to-many)
// ============================================================================

export const factRelations = pgTable(
  "fact_relations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    factId: uuid("fact_id")
      .notNull()
      .references(() => facts.id, { onDelete: "cascade" }),
    relatedFactId: uuid("related_fact_id")
      .notNull()
      .references(() => facts.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("idx_fact_relations_unique").on(
      table.factId,
      table.relatedFactId
    ),
  ]
);

export const factRelationsRelations = relations(factRelations, ({ one }) => ({
  fact: one(facts, {
    fields: [factRelations.factId],
    references: [facts.id],
    relationName: "relatedFrom",
  }),
  relatedFact: one(facts, {
    fields: [factRelations.relatedFactId],
    references: [facts.id],
    relationName: "relatedTo",
  }),
}));

// ============================================================================
// USER BOOKMARKS
// ============================================================================

export const userBookmarks = pgTable(
  "user_bookmarks",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    factId: uuid("fact_id")
      .notNull()
      .references(() => facts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_user_bookmarks_unique").on(table.userId, table.factId),
  ]
);

// ============================================================================
// USER MUTED FACTS
// ============================================================================

export const userMuted = pgTable(
  "user_muted",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    factId: uuid("fact_id")
      .notNull()
      .references(() => facts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_user_muted_unique").on(table.userId, table.factId),
  ]
);

// ============================================================================
// API response shapes (used by both server and client)
// ============================================================================

export const factWithDetailsSchema = z.object({
  id: z.string().uuid(),
  headline: z.string(),
  currentValue: z.string(),
  category: categoryEnum,
  importance: importanceEnum,
  confidence: confidenceEnum,
  tags: z.array(z.string()),
  lastUpdated: z.string(), // ISO string
  timeline: z.array(
    z.object({
      id: z.string().uuid(),
      timestamp: z.string(),
      previousValue: z.string().nullable(),
      newValue: z.string(),
      delta: z.string(),
      whyItMatters: z.string(),
      revisionType: revisionTypeEnum,
      source: z.object({
        name: z.string(),
        url: z.string().nullable(),
        tier: sourceTierEnum,
      }),
    })
  ),
  sources: z.array(
    z.object({
      name: z.string(),
      url: z.string().nullable(),
      tier: sourceTierEnum,
      retrievedAt: z.string(),
    })
  ),
  relatedFacts: z.array(z.string().uuid()),
  isBookmarked: z.boolean().optional(),
  isMuted: z.boolean().optional(),
});

export type FactWithDetails = z.infer<typeof factWithDetailsSchema>;
