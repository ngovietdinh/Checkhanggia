import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class AggregateCodesDto {
  // public_id cua thung/hop cha - phai la ma da ton tai, thuong duoc tao truoc
  // voi hierarchy_level tuong ung (box/carton) trong cung mot lan goi generate-batch
  // rieng, hoac tao qua endpoint nay neu chua co.
  @IsString()
  parentPublicId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  childPublicIds: string[];
}
