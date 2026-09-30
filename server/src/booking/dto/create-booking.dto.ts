import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ArrayMinSize,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  showId: string;

  @IsString()
  @IsNotEmpty()
  lockId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  seatIds: string[];

  @IsOptional()
  @IsString()
  offerId?: string;
}
