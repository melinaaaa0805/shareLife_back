import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { RewardAssignee } from '../enums/reward-assignee.enum';

export class CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(Object.values(RewardAssignee))
  assignedTo: RewardAssignee;
}
