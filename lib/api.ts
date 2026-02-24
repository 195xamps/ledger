/**
 * API hooks for Ledger.
 *
 * Drop-in replacement for mock data. Components switch from:
 *   import { MOCK_FACTS, getFactById } from '@/lib/mockData'
 * to:
 *   import { useFacts, useFact } from '@/lib/api'
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "./query-client";
import type { Fact, Category, ImportanceLevel, ConfidenceLevel } from "./types";

// Re-export the type expected by components (server returns ISO strings for dates)
export interface ApiFact extends Omit<Fact, "lastUpdated" | "timeline"> {
  lastUpdated: string;
  isBookmarked?: boolean;
  isMuted?: boolean;
  timeline: Array<
    Omit<Fact["timeline"][number], "timestamp"> & { timestamp: string }
  >;
}

// Helper: parse ISO dates back to Date objects for components
function parseFact(f: ApiFact): Fact {
  return {
    ...f,
    lastUpdated: new Date(f.lastUpdated),
    timeline: f.timeline.map((rev) => ({
      ...rev,
      timestamp: new Date(rev.timestamp),
    })),
  };
}

// ============================================================================
// FACTS
// ============================================================================

interface UseFactsOptions {
  category?: Category | "all";
  importance?: ImportanceLevel;
  confidence?: ConfidenceLevel;
  limit?: number;
  offset?: number;
}

export function useFacts(options: UseFactsOptions = {}) {
  const { category, importance, confidence, limit = 20, offset = 0 } = options;

  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (importance) params.set("importance", importance);
  if (confidence) params.set("confidence", confidence);
  if (limit) params.set("limit", String(limit));
  if (offset) params.set("offset", String(offset));

  const queryString = params.toString();
  const path = `/api/facts${queryString ? `?${queryString}` : ""}`;

  return useQuery<{ facts: ApiFact[]; total: number }, Error, { facts: Fact[]; total: number }>({
    queryKey: [path],
    queryFn: getQueryFn({ on401: "returnNull" }),
    select: (data) => {
      if (!data) return { facts: [], total: 0 };
      return {
        facts: data.facts.map(parseFact),
        total: data.total,
      };
    },
    staleTime: 30_000, // 30s
    refetchInterval: 60_000, // poll every 60s
  });
}

export function useFact(id: string | undefined) {
  return useQuery<ApiFact, Error, Fact>({
    queryKey: [`/api/facts/${id}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!id,
    select: (data) => (data ? parseFact(data) : undefined as any),
    staleTime: 15_000,
  });
}

export function useTrendingFacts(limit = 5) {
  return useQuery<{ facts: ApiFact[] }, Error, Fact[]>({
    queryKey: [`/api/facts/trending?limit=${limit}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    select: (data) => (data?.facts ?? []).map(parseFact),
    staleTime: 60_000,
  });
}

export function useDisputedFacts() {
  return useQuery<{ facts: ApiFact[] }, Error, Fact[]>({
    queryKey: ["/api/facts/disputed"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    select: (data) => (data?.facts ?? []).map(parseFact),
    staleTime: 60_000,
  });
}

// ============================================================================
// SEARCH
// ============================================================================

export function useSearchFacts(query: string) {
  return useQuery<{ facts: ApiFact[]; query: string }, Error, Fact[]>({
    queryKey: [`/api/search?q=${encodeURIComponent(query)}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: query.length > 0,
    select: (data) => (data?.facts ?? []).map(parseFact),
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
  return useQuery<{ categories: CategoryStat[] }, Error, CategoryStat[]>({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    select: (data) => data?.categories ?? [],
    staleTime: 60_000,
  });
}

// ============================================================================
// BOOKMARKS
// ============================================================================

export function useBookmarks() {
  return useQuery<{ facts: ApiFact[] }, Error, Fact[]>({
    queryKey: ["/api/bookmarks"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    select: (data) => (data?.facts ?? []).map(parseFact),
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation<{ bookmarked: boolean }, Error, string>({
    mutationFn: async (factId: string) => {
      const res = await apiRequest("POST", `/api/bookmarks/${factId}`);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh bookmark state
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      // Also invalidate any fact queries that might show bookmark status
      queryClient.invalidateQueries({
        predicate: (query) =>
          (query.queryKey[0] as string)?.startsWith("/api/facts"),
      });
    },
  });
}

// ============================================================================
// MUTE
// ============================================================================

export function useToggleMute() {
  const queryClient = useQueryClient();

  return useMutation<{ muted: boolean }, Error, string>({
    mutationFn: async (factId: string) => {
      const res = await apiRequest("POST", `/api/mute/${factId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          (query.queryKey[0] as string)?.startsWith("/api/facts"),
      });
    },
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
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: Infinity,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<AuthUser, Error, { username: string; password: string }>({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation<
    AuthUser,
    Error,
    { username: string; password: string; email?: string }
  >({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries();
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation<
    { preferences: AuthUser["preferences"] },
    Error,
    Partial<AuthUser["preferences"]>
  >({
    mutationFn: async (prefs) => {
      const res = await apiRequest("PATCH", "/api/auth/preferences", prefs);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}
