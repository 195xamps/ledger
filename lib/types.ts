export type Category =
  | 'economy'
  | 'geopolitics'
  | 'technology'
  | 'science'
  | 'health'
  | 'climate'
  | 'legal'
  | 'security';

export type ImportanceLevel = 'breaking' | 'high' | 'medium' | 'low';

export type ConfidenceLevel = 'confirmed' | 'developing' | 'disputed' | 'retracted';

export type RevisionType =
  | 'initial'
  | 'update'
  | 'correction'
  | 'escalation'
  | 'resolution';

export type SourceTier = 'primary' | 'wire' | 'reporting' | 'analysis';

export interface Source {
  name: string;
  url: string;
  tier: SourceTier;
  retrievedAt: Date;
}

export interface FactRevision {
  id: string;
  timestamp: Date;
  previousValue: string | null;
  newValue: string;
  delta: string;
  whyItMatters: string;
  source: Source;
  revisionType: RevisionType;
}

export interface Fact {
  id: string;
  headline: string;
  currentValue: string;
  category: Category;
  importance: ImportanceLevel;
  timeline: FactRevision[];
  sources: Source[];
  relatedFacts: string[];
  lastUpdated: Date;
  confidence: ConfidenceLevel;
  tags: string[];
}
