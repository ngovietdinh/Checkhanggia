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

export type ResolvedVia = 'local_barcode' | 'openfoodfacts' | 'upcitemdb' | 'not_found';

export interface ResolvedProductInfo {
  name: string;
  brand?: string;
  imageUrl?: string;
  description?: string;
  category?: string;
  ingredients?: string;
  quantity?: string;
  countryOfOrigin?: string;
  manufacturingPlace?: string;
  packaging?: string;
  allergens?: string[];
  traces?: string[];
  additives?: string[];
  nutritionSummary?: string;
}

export interface BarcodeSearchResponse extends SearchResponse {
  resolvedVia: ResolvedVia;
  resolvedProductName?: string;
  resolvedProductInfo?: ResolvedProductInfo;
}
