import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], 
  providers: [UsersService],
  exports: [UsersService], // si tu veux l'utiliser ailleurs (ex: AuthService)
})
export class UsersModule {}
