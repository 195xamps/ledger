import {
  eq,
  desc,
  asc,
  and,
  or,
  ilike,
  sql,
  inArray,
  gt,
  count,
} from "drizzle-orm";
import { db } from "./db";
import {
  users,
  sessions,
  facts,
  factRevisions,
  sources,
  factSources,
  factRelations,
  userBookmarks,
  userMuted,
  type User,
  type InsertUser,
  type Fact,
  type InsertFact,
  type FactRevision,
  type InsertRevision,
  type Source,
  type FactWithDetails,
  type Category,
  type ImportanceLevel,
  type ConfidenceLevel,
} from "@shared/schema";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";

// ============================================================================
// AUTH
// ============================================================================

export async function createUser(data: InsertUser): Promise<User> {
  const hashed = await bcrypt.hash(data.password, 12);
  const [user] = await db
    .insert(users)
    .values({ ...data, password: hashed })
    .returning();
  return user;
}

export async function getUserByUsername(
  username: string
): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return user;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user;
}

export async function verifyPassword(
  user: User,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

export async function createSession(
  userId: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(sessions).values({ userId, token, expiresAt });

  return { token, expiresAt };
}

export async function getSessionByToken(
  token: string
): Promise<{ userId: string } | undefined> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return session ? { userId: session.userId } : undefined;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function updateUserPreferences(
  userId: string,
  preferences: Partial<NonNullable<User["preferences"]>>
): Promise<User> {
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  const merged = { ...(user.preferences ?? {}), ...preferences };
  const [updated] = await db
    .update(users)
    .set({ preferences: merged })
    .where(eq(users.id, userId))
    .returning();

  return updated;
}

// ============================================================================
// FACTS — READ
// ============================================================================

export interface FactsQuery {
  category?: Category;
  importance?: ImportanceLevel;
  confidence?: ConfidenceLevel;
  limit?: number;
  offset?: number;
  userId?: string; // for bookmark/mute status
}

export async function getFacts(query: FactsQuery = {}): Promise<{
  facts: FactWithDetails[];
  total: number;
}> {
  const { category, importance, confidence, limit = 20, offset = 0, userId } = query;

  // Build where conditions
  const conditions = [eq(facts.isActive, true)];
  if (category) conditions.push(eq(facts.category, category));
  if (importance) conditions.push(eq(facts.importance, importance));
  if (confidence) conditions.push(eq(facts.confidence, confidence));

  const where = and(...conditions);

  // Get total count
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(facts)
    .where(where);

  // Get facts
  const rows = await db
    .select()
    .from(facts)
    .where(where)
    .orderBy(desc(facts.lastUpdated))
    .limit(limit)
    .offset(offset);

  // Hydrate each fact with details
  const hydrated = await Promise.all(
    rows.map((row) => hydrateFact(row, userId))
  );

  return { facts: hydrated, total: Number(total) };
}

export async function getFactById(
  id: string,
  userId?: string
): Promise<FactWithDetails | undefined> {
  const [row] = await db
    .select()
    .from(facts)
    .where(eq(facts.id, id))
    .limit(1);

  if (!row) return undefined;
  return hydrateFact(row, userId);
}

export async function getTrendingFacts(
  limit = 5,
  userId?: string
): Promise<FactWithDetails[]> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Facts with the most revisions in the last 24h
  const trending = await db
    .select({
      factId: factRevisions.factId,
      revCount: count(),
    })
    .from(factRevisions)
    .where(gt(factRevisions.timestamp, oneDayAgo))
    .groupBy(factRevisions.factId)
    .orderBy(desc(count()))
    .limit(limit);

  if (trending.length === 0) {
    // Fallback: most recently updated facts
    const { facts: recent } = await getFacts({ limit, userId });
    return recent;
  }

  const factIds = trending.map((t) => t.factId);
  const rows = await db
    .select()
    .from(facts)
    .where(inArray(facts.id, factIds));

  // Maintain trending order
  const rowMap = new Map(rows.map((r) => [r.id, r]));
  const ordered = factIds
    .map((id) => rowMap.get(id))
    .filter(Boolean) as Fact[];

  return Promise.all(ordered.map((row) => hydrateFact(row, userId)));
}

export async function getDisputedFacts(
  userId?: string
): Promise<FactWithDetails[]> {
  const rows = await db
    .select()
    .from(facts)
    .where(and(eq(facts.confidence, "disputed"), eq(facts.isActive, true)))
    .orderBy(desc(facts.lastUpdated));

  return Promise.all(rows.map((row) => hydrateFact(row, userId)));
}

export async function searchFacts(
  query: string,
  userId?: string
): Promise<FactWithDetails[]> {
  const pattern = `%${query}%`;

  // Search across headline, currentValue, and tags
  const rows = await db
    .select()
    .from(facts)
    .where(
      and(
        eq(facts.isActive, true),
        or(
          ilike(facts.headline, pattern),
          ilike(facts.currentValue, pattern),
          sql`${facts.tags}::text ILIKE ${pattern}`
        )
      )
    )
    .orderBy(desc(facts.lastUpdated))
    .limit(50);

  // Also search revisions
  const revisionHits = await db
    .select({ factId: factRevisions.factId })
    .from(factRevisions)
    .where(
      or(
        ilike(factRevisions.delta, pattern),
        ilike(factRevisions.whyItMatters, pattern),
        ilike(factRevisions.newValue, pattern)
      )
    )
    .groupBy(factRevisions.factId)
    .limit(20);

  // Merge unique fact IDs
  const allIds = new Set([
    ...rows.map((r) => r.id),
    ...revisionHits.map((r) => r.factId),
  ]);

  // Get any facts found via revision search that weren't in direct search
  const missingIds = revisionHits
    .map((r) => r.factId)
    .filter((id) => !rows.find((r) => r.id === id));

  let allRows = [...rows];
  if (missingIds.length > 0) {
    const extra = await db
      .select()
      .from(facts)
      .where(and(inArray(facts.id, missingIds), eq(facts.isActive, true)));
    allRows = [...allRows, ...extra];
  }

  return Promise.all(allRows.map((row) => hydrateFact(row, userId)));
}

export async function getCategoryStats(): Promise<
  { category: string; count: number; updatesToday: number }[]
> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const allStats = await db
    .select({
      category: facts.category,
      total: count(),
    })
    .from(facts)
    .where(eq(facts.isActive, true))
    .groupBy(facts.category);

  const todayStats = await db
    .select({
      category: facts.category,
      updates: count(),
    })
    .from(facts)
    .where(
      and(eq(facts.isActive, true), gt(facts.lastUpdated, oneDayAgo))
    )
    .groupBy(facts.category);

  const todayMap = new Map(todayStats.map((s) => [s.category, Number(s.updates)]));

  return allStats.map((s) => ({
    category: s.category,
    count: Number(s.total),
    updatesToday: todayMap.get(s.category) ?? 0,
  }));
}

// ============================================================================
// FACTS — WRITE
// ============================================================================

export async function createFact(
  data: InsertFact,
  initialRevision: Omit<InsertRevision, "factId">,
  sourceNames: { name: string; url?: string; tier: string }[]
): Promise<FactWithDetails> {
  // Insert the fact
  const [fact] = await db.insert(facts).values(data).returning();

  // Insert initial revision
  await db.insert(factRevisions).values({
    ...initialRevision,
    factId: fact.id,
  });

  // Upsert sources and link them
  for (const src of sourceNames) {
    const source = await upsertSource(src.name, src.url, src.tier);
    await db
      .insert(factSources)
      .values({ factId: fact.id, sourceId: source.id })
      .onConflictDoNothing();
  }

  return (await getFactById(fact.id))!;
}

export async function addRevision(
  factId: string,
  revision: Omit<InsertRevision, "factId">,
  newCurrentValue?: string,
  newConfidence?: string,
  newImportance?: string
): Promise<FactWithDetails> {
  // Insert the revision
  await db.insert(factRevisions).values({
    ...revision,
    factId,
  });

  // Update the fact's current state
  const updates: Partial<Fact> = {
    lastUpdated: new Date(),
  };
  if (newCurrentValue) updates.currentValue = newCurrentValue;
  if (newConfidence) updates.confidence = newConfidence;
  if (newImportance) updates.importance = newImportance;

  await db.update(facts).set(updates).where(eq(facts.id, factId));

  // Upsert the revision's source
  if (revision.sourceName) {
    const source = await upsertSource(
      revision.sourceName,
      revision.sourceUrl ?? undefined,
      revision.sourceTier ?? "reporting"
    );
    await db
      .insert(factSources)
      .values({ factId, sourceId: source.id })
      .onConflictDoNothing();
  }

  return (await getFactById(factId))!;
}

export async function linkRelatedFacts(
  factId: string,
  relatedFactId: string
): Promise<void> {
  // Bidirectional link
  await db
    .insert(factRelations)
    .values({ factId, relatedFactId })
    .onConflictDoNothing();
  await db
    .insert(factRelations)
    .values({ factId: relatedFactId, relatedFactId: factId })
    .onConflictDoNothing();
}

// ============================================================================
// SOURCES
// ============================================================================

async function upsertSource(
  name: string,
  url?: string,
  tier: string = "reporting"
): Promise<Source> {
  const [existing] = await db
    .select()
    .from(sources)
    .where(eq(sources.name, name))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(sources)
    .values({ name, url: url ?? null, tier })
    .returning();

  return created;
}

// ============================================================================
// BOOKMARKS
// ============================================================================

export async function toggleBookmark(
  userId: string,
  factId: string
): Promise<{ bookmarked: boolean }> {
  const [existing] = await db
    .select()
    .from(userBookmarks)
    .where(
      and(eq(userBookmarks.userId, userId), eq(userBookmarks.factId, factId))
    )
    .limit(1);

  if (existing) {
    await db.delete(userBookmarks).where(eq(userBookmarks.id, existing.id));
    return { bookmarked: false };
  } else {
    await db.insert(userBookmarks).values({ userId, factId });
    return { bookmarked: true };
  }
}

export async function getUserBookmarks(
  userId: string
): Promise<FactWithDetails[]> {
  const bookmarks = await db
    .select({ factId: userBookmarks.factId })
    .from(userBookmarks)
    .where(eq(userBookmarks.userId, userId))
    .orderBy(desc(userBookmarks.createdAt));

  if (bookmarks.length === 0) return [];

  const factIds = bookmarks.map((b) => b.factId);
  const rows = await db
    .select()
    .from(facts)
    .where(inArray(facts.id, factIds));

  // Maintain bookmark order
  const rowMap = new Map(rows.map((r) => [r.id, r]));
  const ordered = factIds
    .map((id) => rowMap.get(id))
    .filter(Boolean) as Fact[];

  return Promise.all(ordered.map((row) => hydrateFact(row, userId)));
}

// ============================================================================
// MUTED
// ============================================================================

export async function toggleMute(
  userId: string,
  factId: string
): Promise<{ muted: boolean }> {
  const [existing] = await db
    .select()
    .from(userMuted)
    .where(
      and(eq(userMuted.userId, userId), eq(userMuted.factId, factId))
    )
    .limit(1);

  if (existing) {
    await db.delete(userMuted).where(eq(userMuted.id, existing.id));
    return { muted: false };
  } else {
    await db.insert(userMuted).values({ userId, factId });
    return { muted: true };
  }
}

// ============================================================================
// HYDRATION — assembles a Fact row into the full FactWithDetails shape
// ============================================================================

async function hydrateFact(
  row: Fact,
  userId?: string
): Promise<FactWithDetails> {
  // Get revisions (newest first)
  const revisions = await db
    .select()
    .from(factRevisions)
    .where(eq(factRevisions.factId, row.id))
    .orderBy(desc(factRevisions.timestamp));

  // Get sources via join table
  const factSourceRows = await db
    .select({
      name: sources.name,
      url: sources.url,
      tier: sources.tier,
      retrievedAt: factSources.retrievedAt,
    })
    .from(factSources)
    .innerJoin(sources, eq(factSources.sourceId, sources.id))
    .where(eq(factSources.factId, row.id));

  // Get related fact IDs
  const relations = await db
    .select({ relatedFactId: factRelations.relatedFactId })
    .from(factRelations)
    .where(eq(factRelations.factId, row.id));

  // Check bookmark/mute status if user provided
  let isBookmarked = false;
  let isMuted = false;

  if (userId) {
    const [bm] = await db
      .select()
      .from(userBookmarks)
      .where(
        and(
          eq(userBookmarks.userId, userId),
          eq(userBookmarks.factId, row.id)
        )
      )
      .limit(1);
    isBookmarked = !!bm;

    const [mt] = await db
      .select()
      .from(userMuted)
      .where(
        and(eq(userMuted.userId, userId), eq(userMuted.factId, row.id))
      )
      .limit(1);
    isMuted = !!mt;
  }

  return {
    id: row.id,
    headline: row.headline,
    currentValue: row.currentValue,
    category: row.category as any,
    importance: row.importance as any,
    confidence: row.confidence as any,
    tags: (row.tags as string[]) ?? [],
    lastUpdated: row.lastUpdated.toISOString(),
    timeline: revisions.map((rev) => ({
      id: rev.id,
      timestamp: rev.timestamp.toISOString(),
      previousValue: rev.previousValue,
      newValue: rev.newValue,
      delta: rev.delta,
      whyItMatters: rev.whyItMatters,
      revisionType: rev.revisionType as any,
      source: {
        name: rev.sourceName,
        url: rev.sourceUrl,
        tier: rev.sourceTier as any,
      },
    })),
    sources: factSourceRows.map((s) => ({
      name: s.name,
      url: s.url,
      tier: s.tier as any,
      retrievedAt: s.retrievedAt.toISOString(),
    })),
    relatedFacts: relations.map((r) => r.relatedFactId),
    isBookmarked,
    isMuted,
  };
}
