/**
 * Seed script: populates the database with initial facts.
 * Run: npx tsx scripts/seed.ts
 *
 * Idempotent — checks if facts already exist before inserting.
 */

import { db } from "../server/db";
import {
  createFact,
  addRevision,
  linkRelatedFacts,
} from "../server/storage";
import { facts } from "@shared/schema";
import { count } from "drizzle-orm";

const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 60 * 60 * 1000);
const daysAgo = (d: number) =>
  new Date(Date.now() - d * 24 * 60 * 60 * 1000);

interface SeedFact {
  headline: string;
  currentValue: string;
  category: string;
  importance: string;
  confidence: string;
  tags: string[];
  lastUpdated: Date;
  revisions: {
    timestamp: Date;
    previousValue: string | null;
    newValue: string;
    delta: string;
    whyItMatters: string;
    revisionType: string;
    sourceName: string;
    sourceUrl?: string;
    sourceTier: string;
  }[];
  sources: { name: string; url?: string; tier: string }[];
  // Track by key for linking related facts after creation
  key: string;
  relatedKeys: string[];
}

const SEED_FACTS: SeedFact[] = [
  {
    key: "fed-rate",
    headline: "Federal Funds Rate",
    currentValue: "4.25–4.50% (held)",
    category: "economy",
    importance: "breaking",
    confidence: "confirmed",
    tags: ["federal-reserve", "interest-rates", "monetary-policy"],
    lastUpdated: hoursAgo(2),
    relatedKeys: ["cpi", "treasury", "unemployment"],
    sources: [
      { name: "Federal Reserve", url: "https://federalreserve.gov", tier: "primary" },
      { name: "Reuters", url: "https://reuters.com", tier: "wire" },
    ],
    revisions: [
      {
        timestamp: hoursAgo(2),
        previousValue: "Market expected 25bp cut",
        newValue: "4.25–4.50% (held)",
        delta: "Rate held steady — first hold after 3 consecutive cuts",
        whyItMatters:
          "The Fed's pause signals renewed concern about inflation persistence, pushing back expectations for further easing into late 2026.",
        revisionType: "update",
        sourceName: "Federal Reserve",
        sourceUrl: "https://federalreserve.gov",
        sourceTier: "primary",
      },
      {
        timestamp: daysAgo(30),
        previousValue: "4.50–4.75%",
        newValue: "4.25–4.50%",
        delta: "Third consecutive 25bp cut",
        whyItMatters:
          "The January cut completed a 75bp easing cycle begun in late 2025, bringing rates to their lowest since early 2023.",
        revisionType: "update",
        sourceName: "Federal Reserve",
        sourceTier: "primary",
      },
      {
        timestamp: daysAgo(60),
        previousValue: "4.75–5.00%",
        newValue: "4.50–4.75%",
        delta: "Second consecutive 25bp cut",
        whyItMatters:
          "Back-to-back cuts confirmed the Fed's pivot toward accommodation as labor market data softened.",
        revisionType: "update",
        sourceName: "Federal Reserve",
        sourceTier: "primary",
      },
      {
        timestamp: daysAgo(90),
        previousValue: null,
        newValue: "4.75–5.00%",
        delta: "First cut since 2020",
        whyItMatters:
          "The Fed's initial rate cut marked the end of the most aggressive tightening cycle in four decades.",
        revisionType: "initial",
        sourceName: "Federal Reserve",
        sourceTier: "primary",
      },
    ],
  },
  {
    key: "cpi",
    headline: "US CPI Inflation Rate",
    currentValue: "3.1% (Jan 2026)",
    category: "economy",
    importance: "high",
    confidence: "confirmed",
    tags: ["inflation", "cpi", "consumer-prices"],
    lastUpdated: hoursAgo(6),
    relatedKeys: ["fed-rate", "treasury"],
    sources: [
      { name: "Bureau of Labor Statistics", url: "https://bls.gov", tier: "primary" },
      { name: "AP", url: "https://apnews.com", tier: "wire" },
    ],
    revisions: [
      {
        timestamp: hoursAgo(6),
        previousValue: "2.9% (Dec 2025)",
        newValue: "3.1% (Jan 2026)",
        delta: "Inflation ticked up 0.2pp to 3.1%",
        whyItMatters:
          "The uptick complicates the Fed's path and may have contributed to their decision to hold rates steady.",
        revisionType: "update",
        sourceName: "Bureau of Labor Statistics",
        sourceTier: "primary",
      },
      {
        timestamp: daysAgo(32),
        previousValue: null,
        newValue: "2.9% (Dec 2025)",
        delta: "CPI at 2.9% — lowest in over a year",
        whyItMatters:
          "Falling inflation supported the case for the Fed's third consecutive rate cut.",
        revisionType: "initial",
        sourceName: "Bureau of Labor Statistics",
        sourceTier: "primary",
      },
    ],
  },
  {
    key: "ukraine",
    headline: "Ukraine-Russia Ceasefire Status",
    currentValue: "72-hour ceasefire in effect (expires Feb 26)",
    category: "geopolitics",
    importance: "breaking",
    confidence: "developing",
    tags: ["ukraine", "russia", "ceasefire", "conflict"],
    lastUpdated: hoursAgo(4),
    relatedKeys: [],
    sources: [
      { name: "Reuters", url: "https://reuters.com", tier: "wire" },
      { name: "AP", url: "https://apnews.com", tier: "wire" },
      { name: "Turkish Foreign Ministry", tier: "primary" },
    ],
    revisions: [
      {
        timestamp: hoursAgo(4),
        previousValue: "Ceasefire negotiations ongoing in Istanbul",
        newValue: "72-hour ceasefire in effect",
        delta: "Talks → active ceasefire agreed",
        whyItMatters:
          "First formal ceasefire since the conflict began, brokered by Turkey with US and EU backing.",
        revisionType: "escalation",
        sourceName: "Reuters",
        sourceTier: "wire",
      },
      {
        timestamp: daysAgo(3),
        previousValue: null,
        newValue: "Ceasefire negotiations ongoing in Istanbul",
        delta: "Talks opened in Istanbul",
        whyItMatters:
          "Diplomatic progress after months of stalemate on the eastern front.",
        revisionType: "initial",
        sourceName: "AP",
        sourceTier: "wire",
      },
    ],
  },
  {
    key: "apple-chip",
    headline: "Apple Custom AI Server Chip",
    currentValue: "In-house AI inference chip confirmed for 2026 deployment",
    category: "technology",
    importance: "high",
    confidence: "developing",
    tags: ["apple", "ai", "chips", "hardware"],
    lastUpdated: hoursAgo(28),
    relatedKeys: [],
    sources: [
      { name: "The Information", tier: "reporting" },
      { name: "Bloomberg", url: "https://bloomberg.com", tier: "reporting" },
    ],
    revisions: [
      {
        timestamp: hoursAgo(28),
        previousValue: "Rumored internal chip project",
        newValue: "Confirmed for 2026 deployment",
        delta: "Rumor → confirmed timeline",
        whyItMatters:
          "Apple building its own AI server chips reduces dependence on Nvidia and could reshape the AI infrastructure market.",
        revisionType: "update",
        sourceName: "The Information",
        sourceTier: "reporting",
      },
      {
        timestamp: daysAgo(14),
        previousValue: null,
        newValue: "Rumored internal chip project",
        delta: "Initial report of Apple AI chip development",
        whyItMatters:
          "Would make Apple the latest tech giant to design custom AI silicon, joining Google and Amazon.",
        revisionType: "initial",
        sourceName: "Bloomberg",
        sourceTier: "reporting",
      },
    ],
  },
  {
    key: "eu-ai",
    headline: "EU AI Act Enforcement",
    currentValue: "First penalties issued against 2 companies for prohibited AI practices",
    category: "technology",
    importance: "high",
    confidence: "confirmed",
    tags: ["eu", "ai-regulation", "compliance", "policy"],
    lastUpdated: hoursAgo(8),
    relatedKeys: [],
    sources: [
      { name: "European Commission", tier: "primary" },
    ],
    revisions: [
      {
        timestamp: hoursAgo(8),
        previousValue: "Enforcement period active, no penalties yet",
        newValue: "First penalties issued against 2 companies",
        delta: "0 penalties → 2 companies fined",
        whyItMatters:
          "First enforcement action under the AI Act signals regulators are serious about compliance timelines.",
        revisionType: "escalation",
        sourceName: "European Commission",
        sourceTier: "primary",
      },
      {
        timestamp: daysAgo(22),
        previousValue: null,
        newValue: "Enforcement period active, no penalties yet",
        delta: "AI Act enforcement officially started Feb 2, 2026",
        whyItMatters:
          "Prohibited AI practices (social scoring, real-time biometric surveillance) now carry penalties up to €35M.",
        revisionType: "initial",
        sourceName: "European Commission",
        sourceTier: "primary",
      },
    ],
  },
  {
    key: "treasury",
    headline: "10-Year Treasury Yield",
    currentValue: "4.41%",
    category: "economy",
    importance: "medium",
    confidence: "confirmed",
    tags: ["treasury", "bonds", "yield", "rates"],
    lastUpdated: hoursAgo(1),
    relatedKeys: ["fed-rate"],
    sources: [
      { name: "U.S. Treasury", tier: "primary" },
    ],
    revisions: [
      {
        timestamp: hoursAgo(1),
        previousValue: "4.35%",
        newValue: "4.41%",
        delta: "Yield up 6bp to 4.41%",
        whyItMatters:
          "Yields rose after the Fed held rates, reflecting market repricing of the rate-cut timeline.",
        revisionType: "update",
        sourceName: "U.S. Treasury",
        sourceTier: "primary",
      },
    ],
  },
  {
    key: "scs",
    headline: "South China Sea — Philippines Standoff",
    currentValue:
      "Philippine Coast Guard reports 3 new blockade incidents at Second Thomas Shoal",
    category: "geopolitics",
    importance: "medium",
    confidence: "confirmed",
    tags: ["south-china-sea", "philippines", "china", "territorial"],
    lastUpdated: hoursAgo(36),
    relatedKeys: [],
    sources: [
      { name: "Philippine Coast Guard", tier: "primary" },
      { name: "Reuters", url: "https://reuters.com", tier: "wire" },
    ],
    revisions: [
      {
        timestamp: hoursAgo(36),
        previousValue: "Tensions elevated after water cannon incident",
        newValue: "3 new blockade incidents reported",
        delta: "Single incident → pattern of blockades",
        whyItMatters:
          "Repeated blockades of resupply missions to BRP Sierra Madre risk triggering the US-Philippines mutual defense treaty.",
        revisionType: "escalation",
        sourceName: "Philippine Coast Guard",
        sourceTier: "primary",
      },
    ],
  },
  {
    key: "quantum",
    headline: "Google Quantum Computing — Willow Chip",
    currentValue:
      "Demonstrated quantum error correction below threshold on 105-qubit chip",
    category: "technology",
    importance: "medium",
    confidence: "confirmed",
    tags: ["quantum", "google", "computing", "research"],
    lastUpdated: daysAgo(3),
    relatedKeys: [],
    sources: [
      { name: "Nature", tier: "primary" },
      { name: "Google AI Blog", tier: "primary" },
    ],
    revisions: [
      {
        timestamp: daysAgo(3),
        previousValue: "105-qubit Willow chip announced",
        newValue: "Error correction below threshold demonstrated",
        delta: "Chip announced → error correction breakthrough verified",
        whyItMatters:
          "Achieving below-threshold error correction is a critical milestone toward practical quantum computing.",
        revisionType: "update",
        sourceName: "Nature",
        sourceTier: "primary",
      },
      {
        timestamp: daysAgo(10),
        previousValue: null,
        newValue: "105-qubit Willow chip announced",
        delta: "Google unveiled next-gen quantum chip",
        whyItMatters:
          "Willow represents a significant jump in qubit count and coherence time over Google's previous Sycamore chip.",
        revisionType: "initial",
        sourceName: "Google AI Blog",
        sourceTier: "primary",
      },
    ],
  },
  {
    key: "unemployment",
    headline: "US Unemployment Rate",
    currentValue: "4.1% (Jan 2026)",
    category: "economy",
    importance: "medium",
    confidence: "confirmed",
    tags: ["unemployment", "jobs", "labor-market"],
    lastUpdated: daysAgo(5),
    relatedKeys: ["fed-rate", "cpi"],
    sources: [
      { name: "Bureau of Labor Statistics", url: "https://bls.gov", tier: "primary" },
    ],
    revisions: [
      {
        timestamp: daysAgo(5),
        previousValue: "4.0%",
        newValue: "4.1%",
        delta: "Unemployment ticked up 0.1pp to 4.1%",
        whyItMatters:
          "Slight rise remains within historical norms but adds to the mixed economic picture.",
        revisionType: "update",
        sourceName: "Bureau of Labor Statistics",
        sourceTier: "primary",
      },
    ],
  },
  {
    key: "tiktok",
    headline: "TikTok US Operations",
    currentValue:
      "Operating under 90-day extension; ByteDance divestiture deadline Apr 2026",
    category: "technology",
    importance: "high",
    confidence: "developing",
    tags: ["tiktok", "bytedance", "ban", "social-media"],
    lastUpdated: daysAgo(2),
    relatedKeys: [],
    sources: [
      { name: "White House", tier: "primary" },
      { name: "AP", url: "https://apnews.com", tier: "wire" },
    ],
    revisions: [
      {
        timestamp: daysAgo(2),
        previousValue: "Executive order granted 75-day extension",
        newValue: "90-day extension; divestiture deadline Apr 2026",
        delta: "75-day → 90-day extension granted",
        whyItMatters:
          "Extended timeline gives potential buyers more negotiation room but keeps forced-sale pressure on ByteDance.",
        revisionType: "update",
        sourceName: "White House",
        sourceTier: "primary",
      },
      {
        timestamp: daysAgo(30),
        previousValue: null,
        newValue: "Executive order grants 75-day extension",
        delta: "Ban upheld → temporary reprieve via executive order",
        whyItMatters:
          "Executive action delays enforcement despite Supreme Court ruling, creating legal uncertainty.",
        revisionType: "initial",
        sourceName: "AP",
        sourceTier: "wire",
      },
    ],
  },
  {
    key: "china-gdp",
    headline: "China GDP Growth (2025)",
    currentValue:
      "Official: 5.2% — Independent estimates: 2.5–3.8%",
    category: "economy",
    importance: "medium",
    confidence: "disputed",
    tags: ["china", "gdp", "economy", "disputed"],
    lastUpdated: daysAgo(4),
    relatedKeys: [],
    sources: [
      { name: "National Bureau of Statistics of China", tier: "primary" },
      { name: "Rhodium Group", tier: "analysis" },
    ],
    revisions: [
      {
        timestamp: daysAgo(4),
        previousValue: "Official: 5.0% (Q3 2025)",
        newValue: "Official: 5.2% — Independent: 2.5–3.8%",
        delta: "Independent estimates diverge sharply from official figures",
        whyItMatters:
          "Growing gap between official and independent estimates raises questions about the reliability of China's economic data.",
        revisionType: "update",
        sourceName: "Rhodium Group",
        sourceTier: "analysis",
      },
    ],
  },
];

async function seed() {
  console.log("🌱 Checking database...");

  const [{ value: existing }] = await db
    .select({ value: count() })
    .from(facts);

  if (Number(existing) > 0) {
    console.log(`  Database already has ${existing} facts. Skipping seed.`);
    console.log('  To re-seed, run: DROP TABLE facts CASCADE; then re-run.');
    process.exit(0);
  }

  console.log("🌱 Seeding database with initial facts...\n");

  // Create all facts and store their DB IDs keyed by our local key
  const keyToId = new Map<string, string>();

  for (const seedFact of SEED_FACTS) {
    // Revisions are ordered newest-first in seed data.
    // Insert the oldest (initial) revision first, then layer on updates.
    const orderedRevisions = [...seedFact.revisions].reverse();
    const initialRevision = orderedRevisions[0];

    const created = await createFact(
      {
        headline: seedFact.headline,
        currentValue: seedFact.currentValue,
        category: seedFact.category,
        importance: seedFact.importance,
        confidence: seedFact.confidence,
        tags: seedFact.tags,
        lastUpdated: seedFact.lastUpdated,
      },
      {
        timestamp: initialRevision.timestamp,
        previousValue: initialRevision.previousValue,
        newValue: initialRevision.newValue,
        delta: initialRevision.delta,
        whyItMatters: initialRevision.whyItMatters,
        revisionType: initialRevision.revisionType,
        sourceName: initialRevision.sourceName,
        sourceUrl: initialRevision.sourceUrl ?? null,
        sourceTier: initialRevision.sourceTier,
      },
      seedFact.sources
    );

    keyToId.set(seedFact.key, created.id);
    console.log(`  ✓ ${seedFact.headline}`);

    // Add remaining revisions
    for (let i = 1; i < orderedRevisions.length; i++) {
      const rev = orderedRevisions[i];
      await addRevision(created.id, {
        timestamp: rev.timestamp,
        previousValue: rev.previousValue,
        newValue: rev.newValue,
        delta: rev.delta,
        whyItMatters: rev.whyItMatters,
        revisionType: rev.revisionType,
        sourceName: rev.sourceName,
        sourceUrl: rev.sourceUrl ?? null,
        sourceTier: rev.sourceTier,
      });
    }
  }

  // Link related facts
  console.log("\n🔗 Linking related facts...");
  for (const seedFact of SEED_FACTS) {
    const fromId = keyToId.get(seedFact.key);
    if (!fromId) continue;

    for (const relKey of seedFact.relatedKeys) {
      const toId = keyToId.get(relKey);
      if (toId) {
        await linkRelatedFacts(fromId, toId);
        console.log(`  ✓ ${seedFact.key} ↔ ${relKey}`);
      }
    }
  }

  console.log(`\n✅ Seeded ${SEED_FACTS.length} facts with full timelines.\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
