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

export type FraudReportStatus = 'new' | 'verifying' | 'confirmed' | 'rejected';

export interface FraudReportItem {
  id: string;
  public_id: string | null;
  image_urls: string[];
  lat: number | null;
  lng: number | null;
  store_name: string | null;
  description: string | null;
  status: FraudReportStatus;
  created_at: string;
  product_name: string | null;
  category_code: string | null;
  batch_number: string | null;
}

export interface FraudReportListResponse {
  items: FraudReportItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  statusCounts: Record<FraudReportStatus, number>;
  categoryCounts: { category: string; count: number }[];
}
