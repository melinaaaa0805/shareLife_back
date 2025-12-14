import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterUserDto) {
    const { email, password, firstName } = registerDto;
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      firstName,
      password: hashedPassword,
      role: 'MEMBER',
    });
    await this.userRepository.save(user);
    const payload = { sub: user.id };
    return {
      user,
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(loginDto: LoginUserDto) {
    const { email, password } = loginDto;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id };
    return {
      user,
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUser(userId: string) {
    return this.userRepository.findOne({ where: { id: userId } });
  }
}
