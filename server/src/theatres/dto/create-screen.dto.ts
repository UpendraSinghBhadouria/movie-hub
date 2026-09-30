import { IsInt, IsString, Min } from 'class-validator';

export class CreateScreenDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  seatCount: number;
}
