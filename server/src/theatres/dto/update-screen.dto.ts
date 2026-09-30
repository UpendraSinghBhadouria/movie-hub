import { PartialType } from '@nestjs/mapped-types';
import { CreateScreenDto } from './create-screen.dto.js';

export class UpdateScreenDto extends PartialType(CreateScreenDto) {}
