import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ example: 'alice@example.com', description: 'Adresse email' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Password1', description: 'Mot de passe' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
