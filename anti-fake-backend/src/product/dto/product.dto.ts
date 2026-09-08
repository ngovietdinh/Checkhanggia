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
