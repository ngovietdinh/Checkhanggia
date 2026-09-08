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
