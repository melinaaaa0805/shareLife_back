import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre',
  })
  newPassword: string;
}
