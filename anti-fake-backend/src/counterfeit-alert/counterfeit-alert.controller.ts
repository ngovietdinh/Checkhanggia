import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminKeyGuard } from '../common/admin-key.guard';
import { CounterfeitAlertService } from './counterfeit-alert.service';
import { CreateCounterfeitAlertDto } from './dto/create-counterfeit-alert.dto';

@Controller('api/v1/counterfeit-alerts')
export class CounterfeitAlertController {
  constructor(private readonly service: CounterfeitAlertService) {}

  // Public - ai cung xem duoc danh sach (minh bach, dung tinh than canh bao cong dong)
  @Get()
  list(@Query('page') page?: string, @Query('q') q?: string) {
    return this.service.list(page ? parseInt(page, 10) : 1, q);
  }

  // Bao ve bang ADMIN_API_KEY - xem AdminKeyGuard de biet ly do khong dung chung RBAC doanh nghiep
  @Post()
  @UseGuards(AdminKeyGuard)
  create(@Body() dto: CreateCounterfeitAlertDto) {
    return this.service.create(dto);
  }
}
