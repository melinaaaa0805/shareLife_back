import {
  Controller,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService, UpdateProfileDto } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../help';
import { User } from './entities/user.entity';

@ApiTags('Utilisateurs')
@ApiBearerAuth()
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

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAccount(
    @CurrentUser() user: User,
    @Body('password') password: string,
  ) {
    return this.usersService.deleteAccount(user.id, password);
  }
}
