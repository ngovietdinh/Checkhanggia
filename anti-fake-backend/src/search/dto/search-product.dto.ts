import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  productName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  batchNumber?: string;
}
