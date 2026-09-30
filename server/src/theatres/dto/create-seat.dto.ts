import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { SeatCategory } from '../../generated/prisma/enums.js';

export class CreateSeatDto {
  @IsString()
  row: string;

  @IsInt()
  @Min(1)
  number: number;

  @IsEnum(SeatCategory)
  category: SeatCategory;

  @IsNumber()
  @Min(0)
  price: number;
}
