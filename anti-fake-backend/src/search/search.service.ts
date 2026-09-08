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
