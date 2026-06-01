import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../help';
import { User } from '../users/entities/user.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('token')
  @HttpCode(HttpStatus.NO_CONTENT)
  registerToken(@CurrentUser() user: User, @Body('token') token: string) {
    return this.notificationsService.saveToken(user.id, token);
  }

  @Delete('token')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeToken(@CurrentUser() user: User) {
    return this.notificationsService.removeToken(user.id);
  }
}
