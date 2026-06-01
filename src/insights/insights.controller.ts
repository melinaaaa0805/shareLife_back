import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InsightsService } from './insights.service';
import { CurrentUser } from '../help';
import { User } from '../users/entities/user.entity';

@ApiTags('Insights')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('group/:groupId')
  getInsights(
    @Param('groupId') groupId: string,
    @Query('week') week: string,
    @Query('year') year: string,
    @CurrentUser() user: User,
  ) {
    return this.insightsService.getInsights(
      groupId,
      parseInt(week, 10),
      parseInt(year, 10),
      user.id,
    );
  }
}
