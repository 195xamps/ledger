# Ledger Server Build — Integration Guide

## What's New

This build adds the full server-side foundation to your Ledger prototype:

### New/Replaced Files

```
REPLACE:
  shared/schema.ts        ← Was: just users table → Now: full data model (10 tables)
  server/storage.ts       ← Was: in-memory Map → Now: full PostgreSQL CRUD layer
  server/routes.ts        ← Was: empty → Now: 20+ API endpoints
  server/index.ts         ← Updated: adds cookie-parser for auth

NEW:
  server/db.ts            ← Database connection pool (Drizzle + pg)
  server/auth.ts          ← Session-based auth middleware (cookie + Bearer token)
  scripts/seed.ts         ← Populates DB with 11 mock facts + full timelines
  lib/api.ts              ← React Query hooks (drop-in replacement for mockData)
```

---

## Step-by-Step Integration

### 1. Install new dependencies

In your Replit shell:

```bash
npm install bcrypt cookie-parser
npm install -D @types/bcrypt @types/cookie-parser
```

### 2. Replace server files

Copy these files into your project, replacing the existing versions:

| File | Action |
|------|--------|
| `shared/schema.ts` | **Replace** — full schema with facts, revisions, sources, sessions, bookmarks |
| `server/db.ts` | **New** — add this file |
| `server/auth.ts` | **New** — add this file |
| `server/storage.ts` | **Replace** — full database operations |
| `server/routes.ts` | **Replace** — all API endpoints |
| `server/index.ts` | **Replace** — adds cookie-parser + PATCH to CORS |
| `scripts/seed.ts` | **New** — add this file |

### 3. Add client API hooks

Copy `lib/api.ts` into your project. This gives you React Query hooks
that replace the mock data imports.

### 4. Push schema to database

Make sure your Replit PostgreSQL is provisioned (DATABASE_URL should be set),
then run:

```bash
npx drizzle-kit push
```

This creates all the tables. You should see output like:
```
Creating table facts...
Creating table fact_revisions...
Creating table sources...
Creating table fact_sources...
Creating table fact_relations...
Creating table sessions...
Creating table user_bookmarks...
Creating table user_muted...
```

### 5. Seed the database

```bash
npx tsx scripts/seed.ts
```

This populates 11 facts with full revision timelines, sources, and
related-fact links. It's idempotent — won't duplicate if run twice.

### 6. Test the API

Start the server and hit the health endpoint:

```bash
# In Replit, the server starts automatically, or:
npm run server:dev

# Test endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/api/facts
curl http://localhost:5000/api/facts/trending
curl http://localhost:5000/api/categories
curl http://localhost:5000/api/search?q=inflation
```

---

## Migrating Components from Mock Data to API

The existing components use `MOCK_FACTS` from `lib/mockData.ts`.
To switch to live data, the changes are minimal:

### Feed Screen (`app/(tabs)/index.tsx`)

```diff
- import { MOCK_FACTS, getFactsForCategory } from '@/lib/mockData';
+ import { useFacts } from '@/lib/api';

  export default function FeedScreen() {
-   const facts = getFactsForCategory(activeFilter);
+   const { data, isLoading, refetch } = useFacts({
+     category: activeFilter === 'all' ? undefined : activeFilter,
+   });
+   const facts = data?.facts ?? [];

    const onRefresh = useCallback(() => {
      setRefreshing(true);
-     setTimeout(() => setRefreshing(false), 1200);
+     refetch().finally(() => setRefreshing(false));
    }, []);

-   const breakingCount = MOCK_FACTS.filter(f => f.importance === 'breaking').length;
+   const breakingCount = facts.filter(f => f.importance === 'breaking').length;
```

### Fact Detail (`app/fact/[id].tsx`)

```diff
- import { getFactById, MOCK_FACTS } from '@/lib/mockData';
+ import { useFact, useFacts } from '@/lib/api';

  export default function FactDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
-   const fact = getFactById(id);
+   const { data: fact, isLoading } = useFact(id);

-   const relatedFacts = fact.relatedFacts
-     .map(rid => MOCK_FACTS.find(f => f.id === rid))
-     .filter(Boolean);
+   // Related facts are loaded via IDs in fact.relatedFacts
+   // You can either fetch each one or do a batch endpoint later
```

### Topics (`app/(tabs)/topics.tsx`)

```diff
+ import { useCategoryStats, useTrendingFacts, useDisputedFacts } from '@/lib/api';

  export default function TopicsScreen() {
+   const { data: categories } = useCategoryStats();
+   const { data: trending } = useTrendingFacts();
+   const { data: disputed } = useDisputedFacts();
```

### Search (`app/(tabs)/search.tsx`)

```diff
- import { MOCK_FACTS } from '@/lib/mockData';
+ import { useSearchFacts, useFacts } from '@/lib/api';

  // Replace local filtering with:
+ const { data: searchResults } = useSearchFacts(debouncedQuery);
```

---

## API Reference

### Public Endpoints (no auth required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/facts` | Paginated fact feed |
| `GET` | `/api/facts/trending` | Most-revised facts (24h) |
| `GET` | `/api/facts/disputed` | Facts with confidence=disputed |
| `GET` | `/api/facts/:id` | Single fact with full timeline |
| `GET` | `/api/search?q=` | Full-text search across facts + revisions |
| `GET` | `/api/categories` | Category list with update counts |

**Query params for `/api/facts`:**
- `category` — economy, geopolitics, technology, etc.
- `importance` — breaking, high, medium, low
- `confidence` — confirmed, developing, disputed, retracted
- `limit` — 1-100 (default 20)
- `offset` — pagination offset

### Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Create account `{username, password}` |
| `POST` | `/api/auth/login` | Login `{username, password}` |
| `POST` | `/api/auth/logout` | End session |
| `GET` | `/api/auth/me` | Current user + preferences |
| `PATCH` | `/api/auth/preferences` | Update preferences |

### User Endpoints (auth required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/bookmarks` | User's bookmarked facts |
| `POST` | `/api/bookmarks/:factId` | Toggle bookmark |
| `POST` | `/api/mute/:factId` | Toggle mute |

### Admin/Ingestion Endpoints (auth required, will be admin-only later)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/admin/facts` | Create a new fact with initial revision |
| `POST` | `/api/admin/facts/:id/revisions` | Add a revision to existing fact |
| `POST` | `/api/admin/facts/:id/link` | Link two related facts |

---

## Database Schema

```
users ─────────────┐
  id (uuid, PK)    │
  username          │
  password (bcrypt) │
  email             │
  preferences (jsonb)
  created_at        │
                    │
sessions ───────────┤
  id (uuid, PK)    │
  user_id (FK) ────┘
  token (unique)
  expires_at

facts ─────────────────┐
  id (uuid, PK)        │
  headline             │
  current_value        │
  category             │
  importance           │
  confidence           │
  tags (jsonb)         │
  last_updated         │
  is_active            │
                       │
fact_revisions ────────┤  (append-only)
  id (uuid, PK)       │
  fact_id (FK) ────────┘
  previous_value
  new_value
  delta
  why_it_matters
  revision_type
  source_name
  source_url
  source_tier
  timestamp

sources ───────────────┐  (normalized)
  id (uuid, PK)       │
  name (unique)        │
  url                  │
  tier                 │
                       │
fact_sources ──────────┤  (many-to-many)
  fact_id (FK) ────────┘
  source_id (FK) ──────┘

fact_relations          (self-referencing M2M)
  fact_id (FK)
  related_fact_id (FK)

user_bookmarks          user_muted
  user_id (FK)            user_id (FK)
  fact_id (FK)            fact_id (FK)
```

---

## What's Next

After this is tested and stable:

1. **Phase 3: Claude Ingestion Pipeline** — Cron job that pulls RSS → calls Claude API → writes facts/revisions to DB
2. **Phase 4: WebSocket/SSE** — Push new facts to connected clients in real time
3. **Phase 5: Push Notifications** — Via Expo Push for breaking facts

The admin endpoints (`/api/admin/facts`, `/api/admin/facts/:id/revisions`)
are already built and ready for the ingestion pipeline to call.
