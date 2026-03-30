import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsIn,
  IsDateString,
  IsArray,
  IsUUID,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExpenseCategory } from '../enums/expense-category.enum';
import { SplitMode } from '../enums/split-mode.enum';

export class ParticipantShareDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  share?: number;
}

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsIn(Object.values(ExpenseCategory))
  category: ExpenseCategory;

  @IsIn(Object.values(SplitMode))
  splitMode: SplitMode;

  @IsDateString()
  date: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ParticipantShareDto)
  participants: ParticipantShareDto[];
}
