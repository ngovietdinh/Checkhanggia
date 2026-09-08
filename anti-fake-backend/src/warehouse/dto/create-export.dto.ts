import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateWarehouseExportDto {
  @IsString()
  batchId: string;

  @IsString()
  @MinLength(2)
  destinationRegion: string;

  @IsString()
  @MinLength(2)
  agencyName: string;

  @IsInt()
  @Min(1)
  cartonQuantity: number;
}
