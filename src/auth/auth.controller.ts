import { Controller, Post, Body, UseGuards, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../help';

@ApiTags('Authentification')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Inscription utilisateur' })
  @ApiResponse({ status: 201, description: 'Compte créé, token JWT retourné' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Token JWT retourné' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  @ApiResponse({ status: 429, description: 'Trop de requêtes' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginUserDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Demande de réinitialisation de mot de passe' })
  @ApiResponse({ status: 200, description: 'Code envoyé si email enregistré (réponse identique quelle que soit l\'existence du compte)' })
  @ApiResponse({ status: 429, description: 'Trop de requêtes' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    // Réponse identique que l'email existe ou non (anti-énumération)
    return { message: 'Si cet email est enregistré, un code vous a été envoyé.' };
  }

  @ApiOperation({ summary: 'Réinitialisation du mot de passe avec code' })
  @ApiResponse({ status: 200, description: 'Mot de passe modifié' })
  @ApiResponse({ status: 401, description: 'Code invalide ou expiré' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil de l\'utilisateur connecté (requête DB fraîche)' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  @ApiResponse({ status: 401, description: 'Token absent ou invalide' })
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@CurrentUser() jwtUser: { id: string }) {
    return this.authService.getMe(jwtUser.id);
  }
}
