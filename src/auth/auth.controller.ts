import { Controller, Post, Body, UseGuards, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../help';

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 5 tentatives max par minute pour register/login/forgot
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginUserDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    // Réponse identique que l'email existe ou non
    return { message: 'Si cet email est enregistré, un code vous a été envoyé.' };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@CurrentUser() jwtUser: { id: string }) {
    return this.authService.getMe(jwtUser.id);
  }
}
