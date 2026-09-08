import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

/**
 * Endpoint public (khong dang nhap) - tim kiem toan truong theo 1 tu khoa
 * duy nhat, thay the cho quet QR khi nguoi dung khong co tem trong tay.
 */
@Controller('api/v1/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // Ket qua day du (2 nhom: hang gia da xac nhan + san pham co dang ky)
  @Get('products')
  @Throttle({ default: { limit: 30, ttl: 60_000 } }) // chong do tim kiem hang loat de "scan" toan bo du lieu
  async search(@Query() dto: SearchQueryDto) {
    return this.searchService.search(dto.q);
  }

  // Goi y nhanh cho autocomplete - goi lien tuc trong luc go phim nen can
  // rate-limit rong hon (nguoi dung go 1 tu ~5-10 ky tu = 5-10 request)
  @Get('suggest')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  async suggest(@Query() dto: SearchQueryDto) {
    return this.searchService.suggest(dto.q);
  }
}
