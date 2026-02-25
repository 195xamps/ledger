/**
 * API hooks for Ledger — drop-in replacement for mockData imports.
 *
 * Components switch from:
 *   import { MOCK_FACTS, getFactById } from '@/lib/mockData'
 * to:
 *   import { useFacts, useFact } from '@/lib/api'
 */

import { fetch } from "expo/fetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, apiRequest } from "./query-client";
import type { Fact, Category, ConfidenceLevel } from "./types";

// ============================================================================
// HELPERS
// ============================================================================

/** Fetch JSON from the API, returning null on 401 instead of throwing. */
async function apiFetch<T>(path: string): Promise<T | null> {
  const baseUrl = getApiUrl();
  const res = await fetch(`${baseUrl}${path}`, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * Transform a raw server fact into the client Fact shape.
 * Server returns: id as number, dates as ISO strings, timeline.source without retrievedAt,
 * relatedFacts as number[].
 * Client expects: id as string, dates as Date, Source with retrievedAt, relatedFacts as string[].
 */
function parseFact(raw: any): Fact {
  return {
    id: String(raw.id),
    headline: raw.headline,
    currentValue: raw.currentValue,
    category: raw.category,
    importance: raw.importance,
    confidence: raw.confidence,
    tags: raw.tags ?? [],
    lastUpdated: new Date(raw.lastUpdated),
    timeline: (raw.timeline ?? []).map((rev: any) => ({
      id: String(rev.id),
      timestamp: new Date(rev.timestamp),
      previousValue: rev.previousValue,
      newValue: rev.newValue,
      delta: rev.delta,
      whyItMatters: rev.whyItMatters,
      revisionType: rev.revisionType,
      source: {
        name: rev.source?.name ?? "",
        url: rev.source?.url ?? "",
        tier: rev.source?.tier ?? "reporting",
        retrievedAt: new Date(rev.timestamp), // proxy — server omits this on timeline
      },
    })),
    sources: (raw.sources ?? []).map((s: any) => ({
      name: s.name,
      url: s.url,
      tier: s.tier,
      retrievedAt: new Date(s.retrievedAt),
    })),
    relatedFacts: (raw.relatedFacts ?? []).map(String),
  };
}

// ============================================================================
// FACTS
// ============================================================================

interface UseFactsOptions {
  category?: Category | "all";
  confidence?: ConfidenceLevel | "all";
  limit?: number;
  offset?: number;
}

export function useFacts(options: UseFactsOptions = {}) {
  const { category, confidence, limit = 50, offset = 0 } = options;

  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (confidence && confidence !== "all") params.set("confidence", confidence);
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));

  const qs = params.toString();
  const path = `/api/facts${qs ? `?${qs}` : ""}`;

  return useQuery<{ facts: Fact[]; total: number }>({
    queryKey: ["facts", category ?? "all", confidence ?? "all", limit, offset],
    queryFn: async () => {
      const data: any = await apiFetch(path);
      if (!data) return { facts: [], total: 0 };
      return {
        facts: (data.facts ?? []).map(parseFact),
        total: data.total ?? 0,
      };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useFact(id: string | undefined) {
  return useQuery<Fact | null>({
    queryKey: ["fact", id],
    queryFn: async () => {
      const data = await apiFetch(`/api/facts/${id}`);
      if (!data) return null;
      return parseFact(data);
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useTrendingFacts(limit = 5) {
  return useQuery<Fact[]>({
    queryKey: ["trending", limit],
    queryFn: async () => {
      const data: any = await apiFetch(`/api/facts/trending?limit=${limit}`);
      return (data?.facts ?? []).map(parseFact);
    },
    staleTime: 60_000,
  });
}

export function useDisputedFacts() {
  return useQuery<Fact[]>({
    queryKey: ["disputed"],
    queryFn: async () => {
      const data: any = await apiFetch("/api/facts/disputed");
      return (data?.facts ?? []).map(parseFact);
    },
    staleTime: 60_000,
  });
}

// ============================================================================
// SEARCH
// ============================================================================

export function useSearchFacts(query: string) {
  return useQuery<Fact[]>({
    queryKey: ["search", query],
    queryFn: async () => {
      const data: any = await apiFetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );
      return (data?.facts ?? []).map(parseFact);
    },
    enabled: query.length > 1,
    staleTime: 30_000,
  });
}

// ============================================================================
// CATEGORIES
// ============================================================================

export interface CategoryStat {
  category: string;
  count: number;
  updatesToday: number;
}

export function useCategoryStats() {
  return useQuery<CategoryStat[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const data: any = await apiFetch("/api/categories");
      return data?.categories ?? [];
    },
    staleTime: 60_000,
  });
}

// ============================================================================
// BOOKMARKS & MUTE
// ============================================================================

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation<{ bookmarked: boolean }, Error, string>({
    mutationFn: async (factId) => {
      const res = await apiRequest("POST", `/api/bookmarks/${factId}`);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["facts"] }),
  });
}

export function useToggleMute() {
  const qc = useQueryClient();
  return useMutation<{ muted: boolean }, Error, string>({
    mutationFn: async (factId) => {
      const res = await apiRequest("POST", `/api/mute/${factId}`);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["facts"] }),
  });
}

// ============================================================================
// AUTH
// ============================================================================

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  preferences: {
    notificationLevel: string;
    displayDensity: string;
    sourceTiers: string[];
  };
}

export function useAuth() {
  return useQuery<AuthUser | null>({
    queryKey: ["auth"],
    queryFn: () => apiFetch("/api/auth/me"),
    staleTime: Infinity,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation<AuthUser, Error, { username: string; password: string }>({
    mutationFn: async (creds) => {
      const res = await apiRequest("POST", "/api/auth/login", creds);
      return res.json();
    },
    onSuccess: (user) => qc.setQueryData(["auth"], user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation<
    AuthUser,
    Error,
    { username: string; password: string; email?: string }
  >({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: (user) => qc.setQueryData(["auth"], user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation<void, Error>({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      qc.setQueryData(["auth"], null);
      qc.invalidateQueries();
    },
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation<any, Error, Partial<AuthUser["preferences"]>>({
    mutationFn: async (prefs) => {
      const res = await apiRequest("PATCH", "/api/auth/preferences", prefs);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth"] }),
  });
}

// ============================================================================
// UTILITY — kept here so components don't need to import from mockData
// ============================================================================

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
