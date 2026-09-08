import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCounterfeitAlertDto {
  @IsString()
  @MaxLength(255)
  productName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  productType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  registrationNumber?: string;

  @IsArray()
  @IsString({ each: true })
  violatingBatches: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  responsibleEntity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sourceGroup?: string;
}
