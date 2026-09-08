export interface CurrentUser {
  id: string;
  email: string;
  fullName?: string;
  role: 'ENTERPRISE_ADMIN' | 'ENTERPRISE_STAFF';
  enterpriseId: string;
}

export interface Product {
  id: string;
  name: string;
  categoryCode: string;
  warrantyMonths: number;
  dataSource: 'manual' | 'api';
  dataQualityStatus: 'verified' | 'unverified';
  createdAt: string;
  _count?: { batches: number };
}

export interface ProductBatch {
  id: string;
  productId: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string | null;
  factoryCode: string | null;
  createdAt: string;
  product?: { name: string };
  _count?: { codes: number };
}

export interface GeneratedCode {
  publicId: string;
  secretCode: string;
}

export interface WarehouseExport {
  id: string;
  batchId: string;
  destinationRegion: string;
  agencyName: string;
  cartonQuantity: number;
  exportedAt: string;
  batch?: { batchNumber: string; product?: { name: string } };
}

export interface DashboardSummary {
  totalCodes: number;
  scannedCodes: number;
  unscannedCodes: number;
  revokedCodes: number;
  productCount: number;
  batchCount: number;
  last30Days: {
    validFirst: number;
    duplicate: number;
    notFound: number;
    wrongSecret: number;
    suspicionRatio: number;
  };
  dailySeries: { day: string; result: string; count: number }[];
}
