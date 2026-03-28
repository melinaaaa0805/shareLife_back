import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendPasswordReset(to: string, code: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; background: #0E0E0E; color: #F5F5F5; border-radius: 16px; padding: 32px;">
        <h1 style="color: #9B7BEA; text-align: center; margin-bottom: 8px;">ShareLife</h1>
        <p style="text-align: center; color: #B5B5B5; margin-bottom: 32px;">Réinitialisation de mot de passe</p>
        <p>Bonjour,</p>
        <p>Voici ton code de réinitialisation (valable <strong>15 minutes</strong>) :</p>
        <div style="background: #1A1A1A; border: 2px solid #9B7BEA; border-radius: 12px; text-align: center; padding: 24px; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #9B7BEA;">${code}</span>
        </div>
        <p style="color: #B5B5B5; font-size: 13px;">Si tu n'es pas à l'origine de cette demande, ignore simplement cet e-mail. Ton mot de passe ne sera pas modifié.</p>
        <hr style="border-color: #2A2A2A; margin: 24px 0;" />
        <p style="color: #555; font-size: 11px; text-align: center;">ShareLife — Tes données sont protégées conformément au RGPD.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"ShareLife" <${process.env.MAIL_USER}>`,
        to,
        subject: 'Code de réinitialisation ShareLife',
        html,
      });
    } catch (err) {
      this.logger.error('Erreur envoi email reset', err);
      throw err;
    }
  }
}
