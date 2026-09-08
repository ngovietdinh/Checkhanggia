import { IsIn } from 'class-validator';

export class UpdateFraudReportStatusDto {
  @IsIn(['new', 'verifying', 'confirmed', 'rejected'])
  status: 'new' | 'verifying' | 'confirmed' | 'rejected';
}
