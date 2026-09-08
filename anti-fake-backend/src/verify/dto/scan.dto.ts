import { IsLatitude, IsLongitude, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ScanDto {
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  publicId: string;

  @IsString()
  @MinLength(4)
  @MaxLength(32)
  secretCode: string;

  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceFingerprint?: string;
}

export class LookupPublicDto {
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  publicId: string;
}
