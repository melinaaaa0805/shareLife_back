import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LeaderboardQueryDto {
  @IsIn(['weekly', 'monthly'])
  period: 'weekly' | 'monthly';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  week?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  month?: number;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year: number;
}
