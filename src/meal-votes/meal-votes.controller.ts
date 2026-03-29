import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MealVotesService } from './meal-votes.service';

@UseGuards(AuthGuard('jwt'))
@Controller('meal-votes')
export class MealVotesController {
  constructor(private readonly mealVotesService: MealVotesService) {}

  @Post()
  vote(
    @Request() req: any,
    @Body()
    body: {
      mealId: string;
      dayOfWeek: number;
      groupId: string;
      weekNumber: number;
      year: number;
    },
  ) {
    return this.mealVotesService.vote(
      req.user.id,
      body.mealId,
      body.dayOfWeek,
      body.groupId,
      body.weekNumber,
      body.year,
    );
  }

  @Get(':groupId/:year/:week/:day')
  getVotesForDay(
    @Param('groupId') groupId: string,
    @Param('year') year: string,
    @Param('week') week: string,
    @Param('day') day: string,
  ) {
    return this.mealVotesService.getVotesForDay(groupId, +year, +week, +day);
  }

  @Get(':groupId/:year/:week')
  getVotesForWeek(
    @Param('groupId') groupId: string,
    @Param('year') year: string,
    @Param('week') week: string,
  ) {
    return this.mealVotesService.getVotesForWeek(groupId, +year, +week);
  }

  @Get('my/:groupId/:year/:week/:day')
  getMyVote(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Param('year') year: string,
    @Param('week') week: string,
    @Param('day') day: string,
  ) {
    return this.mealVotesService.getUserVoteForDay(
      req.user.id,
      groupId,
      +year,
      +week,
      +day,
    );
  }

  @Delete(':id')
  removeVote(@Param('id') id: string) {
    return this.mealVotesService.removeVote(id);
  }
}
