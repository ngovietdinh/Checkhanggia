import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  categoryCode: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyMonths?: number;

  @IsOptional()
  @IsString()
  barcode?: string; // ma vach ban le (EAN-13/UPC-A) - dung cho quet ma vach tu dong nhan dien
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  categoryCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyMonths?: number;

  @IsOptional()
  @IsString()
  barcode?: string;
}

export class CreateBatchDto {
  @IsString()
  productId: string;

  @IsString()
  batchNumber: string;

  @IsString()
  manufactureDate: string; // ISO date string tu client

  @IsOptional()
  @IsString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  factoryCode?: string;
}
