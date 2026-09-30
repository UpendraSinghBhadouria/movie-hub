import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @MinLength(1)
  showId: string;

  @IsArray()
  @IsString({ each: true })
  seatIds: string[];

  @IsString()
  @MinLength(1)
  lockId: string;

  @IsOptional()
  @IsString()
  offerCode?: string;
}
