import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseExportDto } from './dto/create-export.dto';

@Controller('api/v1/warehouse-exports')
@UseGuards(JwtAuthGuard)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  list(@Req() req: any) {
    return this.warehouseService.list(req.user.enterpriseId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateWarehouseExportDto) {
    return this.warehouseService.create(req.user.enterpriseId, req.user.sub, dto);
  }
}
