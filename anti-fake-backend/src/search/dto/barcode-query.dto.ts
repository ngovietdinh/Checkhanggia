import { IsString, MinLength, MaxLength } from 'class-validator';

export class BarcodeQueryDto {
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  code: string;
}
