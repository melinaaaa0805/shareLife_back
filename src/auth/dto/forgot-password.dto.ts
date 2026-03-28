import { IsEmail, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  @MaxLength(255)
  email: string;
}
