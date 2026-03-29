import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Frequency } from '../enums/frequency.enum';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsIn([Frequency.ONCE, Frequency.DAILY, Frequency.WEEKLY])
  frequency: Frequency;

  @IsNumber()
  weekNumber: number;

  @IsNumber()
  year: number;

  @IsNumber()
  dayOfWeek: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  @IsIn(['FAMILY', 'ADULT', 'ADULT_CHILD'])
  taskType?: 'FAMILY' | 'ADULT' | 'ADULT_CHILD';
}
