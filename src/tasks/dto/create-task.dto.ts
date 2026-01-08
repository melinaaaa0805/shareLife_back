import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Frequency } from '../enums/frequency.enum';
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  description?: string;

  @IsString()
  frequency: Frequency.ONCE | Frequency.DAILY | Frequency.WEEKLY;

  @IsNumber()
  weekNumber: number;

  @IsNumber()
  year: number;

  @IsNumber()
  dayOfWeek: number;

  @IsNumber()
  duration?: number;

  @IsString()
  date?: string;

  @IsNumber()
  weight?: number;

  @IsUUID()
  groupId: string;

  @IsUUID()
  createdById: string;

  @IsBoolean()
  isTemplate: boolean;
}
