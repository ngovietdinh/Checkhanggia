import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, CreateBatchDto } from './dto/product.dto';

@Controller('api/v1/products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  list(@Req() req: any) {
    return this.productService.list(req.user.enterpriseId);
  }

  @Get('batches')
  listBatches(@Req() req: any) {
    return this.productService.listBatches(req.user.enterpriseId);
  }

  @Get(':id')
  getOne(@Req() req: any, @Param('id') id: string) {
    return this.productService.getOne(req.user.enterpriseId, id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.productService.create(req.user.enterpriseId, dto);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(req.user.enterpriseId, id, dto);
  }

  @Delete(':id')
  @Roles('ENTERPRISE_ADMIN') // chi Admin duoc xoa (muc 7.2 SRS)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.productService.remove(req.user.enterpriseId, id);
  }

  @Post('batches')
  createBatch(@Req() req: any, @Body() dto: CreateBatchDto) {
    return this.productService.createBatch(req.user.enterpriseId, dto);
  }
}
