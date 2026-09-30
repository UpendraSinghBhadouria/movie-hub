import { PartialType } from '@nestjs/mapped-types';
import { CreateShowDto } from './create-show.dto.js';

export class UpdateShowDto extends PartialType(CreateShowDto) {}
