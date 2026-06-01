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
import { ApiProperty } from '@nestjs/swagger';
import { ExpenseCategory } from '../enums/expense-category.enum';
import { SplitMode } from '../enums/split-mode.enum';

export class ParticipantShareDto {
  @ApiProperty({ example: 'uuid-user', description: 'ID du participant' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 15.50, description: 'Part en euros (mode CUSTOM uniquement)', required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  share?: number;
}

export class CreateExpenseDto {
  @ApiProperty({ example: 'Courses Monoprix', description: 'Titre de la dépense' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 45.90, description: 'Montant total en euros' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: ExpenseCategory, example: ExpenseCategory.FOOD, description: 'Catégorie' })
  @IsIn(Object.values(ExpenseCategory))
  category: ExpenseCategory;

  @ApiProperty({ enum: SplitMode, example: SplitMode.EQUAL, description: 'Mode de répartition' })
  @IsIn(Object.values(SplitMode))
  splitMode: SplitMode;

  @ApiProperty({ example: '2026-06-01', description: 'Date de la dépense (ISO 8601)' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [ParticipantShareDto], description: 'Liste des participants' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ParticipantShareDto)
  participants: ParticipantShareDto[];
}
