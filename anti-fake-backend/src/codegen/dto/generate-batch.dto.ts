import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class GenerateBatchDto {
  @IsUUID()
  batchId: string;

  @IsInt()
  @Min(1)
  @Max(1_000_000) // gioi han 1 lan goi API - so lon hon nen chia thanh nhieu job (xem README)
  quantity: number;

  @IsOptional()
  @IsIn(['unit', 'box', 'carton'])
  hierarchyLevel?: 'unit' | 'box' | 'carton'; // mac dinh 'unit' neu khong truyen
}
