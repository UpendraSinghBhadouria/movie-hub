import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
} from 'class-validator';

export class LockSeatsDto {
  @IsString()
  showId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  seatIds: string[];

  @IsUUID()
  lockId: string;
}
