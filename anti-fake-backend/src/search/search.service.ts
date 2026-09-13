import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { containsNormalized, similarity } from '../common/fuzzy-match.util';

const CANDIDATE_LIMIT = 500; // gioi han so dong lay tho tu DB truoc khi cham diem trong app
const RESULT_LIMIT = 10; // so ket qua day du tra ve nhieu nhat
const SUGGEST_LIMIT = 8; // so goi y autocomplete toi da (can gon, nhanh)
const CLOSE_THRESHOLD = 0.5; // duoi nguong nay coi nhu khong lien quan, loai bo
const SUGGEST_THRESHOLD = 0.35; // autocomplete de nguong thap hon (nguoi dung moi go vai ky tu)
const EXACT_THRESHOLD = 0.9;

export type MatchType = 'exact' | 'close';

export interface SearchResultItem {
  productName: string;
  batchNumber: string;
  manufactureDate: Date;
  enterpriseName: string;
  matchType: MatchType;
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

export type ResolvedVia = 'local_barcode' | 'openfoodfacts' | 'upcitemdb' | 'not_found';

export interface ResolvedProductInfo {
  name: string;
  brand?: string;
  imageUrl?: string;
  description?: string;
  category?: string;
}

export interface BarcodeSearchResponse extends SearchResponse {
  resolvedVia: ResolvedVia;
  resolvedProductName?: string; // giu lai de tuong thich nguoc, trung voi resolvedProductInfo.name
  resolvedProductInfo?: ResolvedProductInfo; // thong tin day du hon (anh, thuong hieu, mo ta) khi co
}

export interface SuggestItem {
  type: 'legitimate' | 'counterfeit';
  label: string;
  sublabel: string;
  score: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tim kiem toan truong (universal search) - MOT tu khoa duy nhat, quet qua
   * MOI truong du lieu co the lien quan (khong chi rieng ten san pham) vi
   * nguoi dung thuong khong nho het chinh xac ten/so lo, co the chi nho mot
   * phan (vi du: ten doanh nghiep, mot phan ma DKSP...).
   */
  async search(q: string): Promise<SearchResponse> {
    const query = q?.trim();
    if (!query || query.length < 2) {
      throw new BadRequestException('Cần nhập ít nhất 2 ký tự để tìm kiếm');
    }

    const [legitimateMatches, counterfeitAlerts] = await Promise.all([
      this.searchLegitimate(query, RESULT_LIMIT, CLOSE_THRESHOLD),
      this.searchCounterfeitAlerts(query, RESULT_LIMIT, CLOSE_THRESHOLD),
    ]);

    return { legitimateMatches, counterfeitAlerts };
  }

  /**
   * Ban rut gon cua search(), toi uu cho goi lien tuc trong luc go phim
   * (autocomplete): nguong thap hon, gioi han ket qua nho, chi tra field
   * can thiet de ve dropdown.
   */
  async suggest(q: string): Promise<SuggestItem[]> {
    const query = q?.trim();
    if (!query || query.length < 2) return [];

    const [legit, counterfeit] = await Promise.all([
      this.searchLegitimate(query, SUGGEST_LIMIT, SUGGEST_THRESHOLD),
      this.searchCounterfeitAlerts(query, SUGGEST_LIMIT, SUGGEST_THRESHOLD),
    ]);

    const merged: SuggestItem[] = [
      ...counterfeit.map((c) => ({
        type: 'counterfeit' as const,
        label: c.productName,
        sublabel: c.registrationNumber || c.violatingBatches[0] || 'Đã xác nhận vi phạm',
        score: c.score,
      })),
      ...legit.map((l) => ({
        type: 'legitimate' as const,
        label: l.productName,
        sublabel: `Lô ${l.batchNumber} · ${l.enterpriseName}`,
        score: l.score,
      })),
    ];

    return merged.sort((a, b) => b.score - a.score).slice(0, SUGGEST_LIMIT);
  }

  /**
   * Tra cuu theo ma vach ban le (EAN-13/UPC-A...) - dung cho tinh nang "quet
   * ma vach tu dong kiem tra". Thu tu uu tien:
   *  1. Doi chieu truc tiep voi du lieu ma vach TU NHAP trong he thong
   *     (counterfeit_alert.barcode va product.barcode) - chinh xac tuyet doi,
   *     khong phu thuoc dich vu ngoai.
   *  2. Neu khong co du lieu noi bo cho ma vach nay, goi Open Food Facts
   *     (mien phi, khong can API key) de nhan dien TEN san pham, roi dung
   *     chinh ten do chay lai qua bo may tim kiem toan truong hien co - vi
   *     du OFF tra ve "Ensure Gold" va day trung ten voi 1 dong trong danh
   *     sach hang gia da nhap thu cong, van bat duoc canh bao.
   *  3. Khong tim thay o dau ca -> tra ve rong, resolvedVia='not_found'.
   */
  async searchByBarcode(barcode: string): Promise<BarcodeSearchResponse> {
    const code = barcode?.trim();
    if (!code) {
      throw new BadRequestException('Thiếu mã vạch');
    }

    // Buoc 1: du lieu noi bo, uu tien tuyet doi
    const [localCounterfeit, localProducts] = await Promise.all([
      this.prisma.counterfeitAlert.findMany({ where: { barcode: code }, take: RESULT_LIMIT }),
      this.prisma.product.findMany({
        where: { barcode: code },
        include: { enterprise: true, batches: { orderBy: { createdAt: 'desc' }, take: 3 } },
      }),
    ]);

    if (localCounterfeit.length > 0 || localProducts.length > 0) {
      const counterfeitAlerts: CounterfeitMatchItem[] = localCounterfeit.map((c) => ({
        productName: c.productName,
        productType: c.productType,
        registrationNumber: c.registrationNumber,
        violatingBatches: c.violatingBatches,
        responsibleEntity: c.responsibleEntity,
        sourceGroup: c.sourceGroup,
        score: 1,
      }));

      const legitimateMatches: SearchResultItem[] = localProducts.flatMap((p) =>
        p.batches.map((b) => ({
          productName: p.name,
          batchNumber: b.batchNumber,
          manufactureDate: b.manufactureDate,
          enterpriseName: p.enterprise.name,
          matchType: 'exact' as const,
          score: 1,
        })),
      );

      return { legitimateMatches, counterfeitAlerts, resolvedVia: 'local_barcode' };
    }

    // Buoc 2: fallback ben ngoai - chi de NHAN DIEN THONG TIN THAM KHAO (ten,
    // anh, thuong hieu, mo ta), khong tu coi "co trong CSDL quoc te" la bang
    // chung hang that (day la CSDL cong dong/thuong mai quoc te, khong lien
    // quan gi toi viec chong hang gia o VN). Thu Open Food Facts truoc
    // (chuyen sau ve thuc pham, khong can API key), neu khong co thi thu
    // UPCitemdb (pho quat hon, cung khong can API key o goi FREE, gioi han
    // 100 luot/ngay theo IP).
    let productInfo = await this.lookupOpenFoodFacts(code);
    let resolvedVia: ResolvedVia = 'openfoodfacts';

    if (!productInfo) {
      productInfo = await this.lookupUpcItemDb(code);
      resolvedVia = 'upcitemdb';
    }

    if (!productInfo) {
      return { legitimateMatches: [], counterfeitAlerts: [], resolvedVia: 'not_found' };
    }

    const [legitimateMatches, counterfeitAlerts] = await Promise.all([
      this.searchLegitimate(productInfo.name, RESULT_LIMIT, CLOSE_THRESHOLD),
      this.searchCounterfeitAlerts(productInfo.name, RESULT_LIMIT, CLOSE_THRESHOLD),
    ]);

    return {
      legitimateMatches,
      counterfeitAlerts,
      resolvedVia,
      resolvedProductName: productInfo.name,
      resolvedProductInfo: productInfo,
    };
  }

  private async lookupOpenFoodFacts(barcode: string): Promise<ResolvedProductInfo | null> {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`, {
        headers: { 'User-Agent': 'AntiFakeApp/1.0 (anti-counterfeit lookup)' },
        signal: AbortSignal.timeout(4000), // khong de nguoi dung cho qua lau neu OFF cham/timeout
      });
      if (!res.ok) return null;
      const data = (await res.json()) as any;
      if (data.status !== 1 || !data.product) return null;
      const p = data.product;
      const name = p.product_name_vi || p.product_name;
      if (!name) return null;
      return {
        name,
        brand: p.brands || undefined,
        imageUrl: p.image_front_url || p.image_url || undefined,
        description: p.generic_name_vi || p.generic_name || p.ingredients_text_vi || p.ingredients_text || undefined,
        category: p.categories?.split(',')?.[0]?.trim() || undefined,
      };
    } catch {
      return null; // OFF loi/timeout - khong chan luong chinh, coi nhu khong nhan dien duoc
    }
  }

  /**
   * UPCitemdb - goi FREE khong can dang ky/API key, endpoint /prod/trial/.
   * Gioi han 100 request/ngay theo IP, burst 6 request/phut (theo tai lieu
   * chinh thuc). Phu quat cac san pham/thuong hieu quoc te lon hon Open Food
   * Facts (von chi chuyen thuc pham) - hop voi cac vu hang gia nhai thuong
   * hieu ngoai trong danh sach BCA (vi du "Ensure Gold", "GH Creation EX").
   * Van KHONG phu duoc cac nhan hang noi dia VN quy mo nho.
   */
  private async lookupUpcItemDb(barcode: string): Promise<ResolvedProductInfo | null> {
    try {
      const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as any;
      const item = data?.items?.[0];
      if (!item?.title) return null;
      return {
        name: item.title,
        brand: item.brand || undefined,
        imageUrl: item.images?.[0] || undefined,
        description: item.description || undefined,
        category: item.category || undefined,
      };
    } catch {
      return null;
    }
  }

  private async searchCounterfeitAlerts(
    query: string,
    limit: number,
    threshold: number,
  ): Promise<CounterfeitMatchItem[]> {
    let candidates = await this.prisma.counterfeitAlert.findMany({
      where: {
        OR: [
          { productName: { contains: query, mode: 'insensitive' } },
          { registrationNumber: { contains: query, mode: 'insensitive' } },
          { responsibleEntity: { contains: query, mode: 'insensitive' } },
          { productType: { contains: query, mode: 'insensitive' } },
          { sourceGroup: { contains: query, mode: 'insensitive' } },
          { violatingBatches: { has: query } },
        ],
      },
      take: CANDIDATE_LIMIT,
      orderBy: { createdAt: 'desc' },
    });

    // Fallback bo dau: ILIKE cua Postgres khong tu bo dau tieng Viet, nen
    // neu khong khop gi ca, quet mot tap gan day roi loc thu cong bang
    // containsNormalized (co bo dau + ha chu thuong) tren TAT CA cac truong.
    if (candidates.length === 0) {
      const broader = await this.prisma.counterfeitAlert.findMany({
        take: CANDIDATE_LIMIT,
        orderBy: { createdAt: 'desc' },
      });
      candidates = broader.filter((c) => this.matchesAnyField(query, this.counterfeitFields(c)));
    }

    const scored = candidates.map((c) => {
      const score = this.bestFieldScore(query, this.counterfeitFields(c));
      return { candidate: c, score };
    });

    return scored
      .filter((s) => s.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => ({
        productName: s.candidate.productName,
        productType: s.candidate.productType,
        registrationNumber: s.candidate.registrationNumber,
        violatingBatches: s.candidate.violatingBatches,
        responsibleEntity: s.candidate.responsibleEntity,
        sourceGroup: s.candidate.sourceGroup,
        score: Math.round(s.score * 100) / 100,
      }));
  }

  private async searchLegitimate(query: string, limit: number, threshold: number): Promise<SearchResultItem[]> {
    let candidates = await this.prisma.productBatch.findMany({
      where: {
        OR: [
          { product: { name: { contains: query, mode: 'insensitive' } } },
          { batchNumber: { contains: query, mode: 'insensitive' } },
          { product: { categoryCode: { contains: query, mode: 'insensitive' } } },
          { factoryCode: { contains: query, mode: 'insensitive' } },
          { product: { enterprise: { name: { contains: query, mode: 'insensitive' } } } },
        ],
      },
      include: { product: { include: { enterprise: true } } },
      take: CANDIDATE_LIMIT,
      orderBy: { createdAt: 'desc' },
    });

    if (candidates.length === 0) {
      const broader = await this.prisma.productBatch.findMany({
        include: { product: { include: { enterprise: true } } },
        take: CANDIDATE_LIMIT,
        orderBy: { createdAt: 'desc' },
      });
      candidates = broader.filter((c) => this.matchesAnyField(query, this.legitimateFields(c)));
    }

    const scored = candidates.map((c) => {
      const score = this.bestFieldScore(query, this.legitimateFields(c));
      const matchType: MatchType = score >= EXACT_THRESHOLD ? 'exact' : 'close';
      return { candidate: c, score, matchType };
    });

    return scored
      .filter((s) => s.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => ({
        productName: s.candidate.product.name,
        batchNumber: s.candidate.batchNumber,
        manufactureDate: s.candidate.manufactureDate,
        enterpriseName: s.candidate.product.enterprise.name,
        matchType: s.matchType,
        score: Math.round(s.score * 100) / 100,
      }));
  }

  private legitimateFields(c: {
    product: { name: string; categoryCode: string; enterprise: { name: string } };
    batchNumber: string;
    factoryCode: string | null;
  }): string[] {
    return [c.product.name, c.batchNumber, c.product.categoryCode, c.factoryCode || '', c.product.enterprise.name];
  }

  private counterfeitFields(c: {
    productName: string;
    productType: string | null;
    registrationNumber: string | null;
    responsibleEntity: string | null;
    sourceGroup: string | null;
    violatingBatches: string[];
  }): string[] {
    return [
      c.productName,
      c.productType || '',
      c.registrationNumber || '',
      c.responsibleEntity || '',
      c.sourceGroup || '',
      ...c.violatingBatches,
    ];
  }

  private matchesAnyField(query: string, fields: string[]): boolean {
    return fields.some((f) => f && containsNormalized(f, query));
  }

  /** Diem tuong dong cao nhat giua query va bat ky truong nao - "khop truong nao cung tinh" */
  private bestFieldScore(query: string, fields: string[]): number {
    let best = 0;
    for (const f of fields) {
      if (!f) continue;
      const containsBonus = containsNormalized(f, query) ? 0.3 : 0;
      const s = Math.min(1, similarity(f, query) + containsBonus);
      if (s > best) best = s;
    }
    return best;
  }
}
