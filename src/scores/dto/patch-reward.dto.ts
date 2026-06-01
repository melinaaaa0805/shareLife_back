import { IsBoolean } from 'class-validator';

export class PatchRewardDto {
  @IsBoolean()
  isActive: boolean;
}
