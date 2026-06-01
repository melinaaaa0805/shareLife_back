import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: 'alice@example.com', description: 'Adresse email' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Password1', description: 'Min 8 caractères, 1 majuscule, 1 chiffre' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre',
  })
  password: string;

  @ApiProperty({ example: 'Alice', description: 'Prénom (2–50 caractères)' })
  @IsString()
  @MinLength(2, { message: 'Le prénom doit contenir au moins 2 caractères' })
  @MaxLength(50)
  firstName: string;
}
