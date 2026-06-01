import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ScoresService } from './scores.service';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { CreateRewardDto } from './dto/create-reward.dto';
import { PatchRewardDto } from './dto/patch-reward.dto';
import { CurrentUser } from '../help';
import { User } from '../users/entities/user.entity';

@ApiTags('Scores')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get('group/:groupId/leaderboard')
  getLeaderboard(
    @Param('groupId') groupId: string,
    @Query() query: LeaderboardQueryDto,
  ) {
    return this.scoresService.getLeaderboard(groupId, query);
  }

  @Get('group/:groupId/rewards')
  findRewards(@Param('groupId') groupId: string) {
    return this.scoresService.findRewards(groupId);
  }

  @Post('group/:groupId/rewards')
  createReward(
    @Param('groupId') groupId: string,
    @Body() dto: CreateRewardDto,
    @CurrentUser() user: User,
  ) {
    return this.scoresService.createReward(groupId, dto, user);
  }

  @Patch('rewards/:id')
  patchReward(@Param('id') id: string, @Body() dto: PatchRewardDto) {
    return this.scoresService.patchReward(id, dto);
  }

  @Delete('rewards/:id')
  deleteReward(@Param('id') id: string) {
    return this.scoresService.deleteReward(id);
  }
}
