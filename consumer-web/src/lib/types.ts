export interface PublicLookupResult {
  status: 'exists' | 'revoked' | 'not_found';
  publicId?: string;
  productName?: string;
  batchNumber?: string;
  manufactureDate?: string;
}

export type VerifyOutcome =
  | { result: 'BLOCKED'; message: string }
  | { result: 'NOT_FOUND' }
  | { result: 'INVALID' }
  | { result: 'REVOKED' }
  | { result: 'DUPLICATE'; firstScannedAt: string | null; approxLocation: { lat: number | null; lng: number | null } | null }
  | { result: 'VALID'; productName?: string; batchNumber?: string };

export interface SearchResultItem {
  productName: string;
  batchNumber: string;
  manufactureDate: string;
  enterpriseName: string;
  matchType: 'exact' | 'close';
  score: number;
}

export interface CounterfeitMatchItem {
  productName: string;
  productType: string | null;
  registrationNumber: string | null;
  violatingBatches: string[];
  responsibleEntity: string | null;
  sourceGroup: string | null;
  score: number;
}

export interface SearchResponse {
  legitimateMatches: SearchResultItem[];
  counterfeitAlerts: CounterfeitMatchItem[];
}

export interface SuggestItem {
  type: 'legitimate' | 'counterfeit';
  label: string;
  sublabel: string;
  score: number;
}
