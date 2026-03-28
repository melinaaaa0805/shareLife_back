import {
  Controller,
  Body,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UsersService, UpdateProfileDto } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../help';
import { User } from './entities/user.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }
}
