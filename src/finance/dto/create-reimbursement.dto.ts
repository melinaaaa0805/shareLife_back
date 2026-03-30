import { IsUUID, IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

export class CreateReimbursementDto {
  @IsUUID()
  toUserId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}
