import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { MailService } from './mail.service';

const GENERIC_ERROR = 'Identifiants incorrects';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  private safeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      avatarColor: user.avatarColor,
    };
  }

  async register(registerDto: RegisterUserDto) {
    const { email, password, firstName } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    // Message générique : ne pas révéler si l'email existe déjà
    if (existingUser) {
      throw new UnauthorizedException(GENERIC_ERROR);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = this.userRepository.create({
      email: email.toLowerCase().trim(),
      firstName: firstName.trim(),
      password: hashedPassword,
      role: 'MEMBER',
    });

    await this.userRepository.save(user);

    const payload = { sub: user.id, email: user.email };
    return {
      user: this.safeUser(user),
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(loginDto: LoginUserDto) {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    // Comparaison systématique pour éviter les timing attacks
    const dummyHash = '$2b$12$invalidhashpaddinginvalidhashpaddinginvalidhashpadding';
    const hashToCompare = user ? user.password : dummyHash;
    const passwordValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordValid) {
      throw new UnauthorizedException(GENERIC_ERROR);
    }

    const payload = { sub: user.id, email: user.email };
    return {
      user: this.safeUser(user),
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUser(userId: string) {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return this.safeUser(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    // Réponse identique que l'email existe ou non (anti-énumération)
    if (!user) return;

    // Code à 6 chiffres, valable 15 min
    const code = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    user.resetToken = await bcrypt.hash(code, 10);
    user.resetTokenExpiry = expiry;
    await this.userRepository.save(user);

    await this.mailService.sendPasswordReset(user.email, code);
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (
      !user ||
      !user.resetToken ||
      !user.resetTokenExpiry ||
      user.resetTokenExpiry < new Date()
    ) {
      throw new BadRequestException('Code invalide ou expiré');
    }

    const codeValid = await bcrypt.compare(code, user.resetToken);
    if (!codeValid) {
      throw new BadRequestException('Code invalide ou expiré');
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await this.userRepository.save(user);
  }
}
