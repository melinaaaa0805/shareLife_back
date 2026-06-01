import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GamificationService } from './gamification.service';
import { CurrentUser } from '../help';
import { User } from '../users/entities/user.entity';

@ApiTags('Gamification')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('me')
  getMyProfile(@CurrentUser() user: User) {
    return this.gamificationService.getProfile(user.id);
  }
}
