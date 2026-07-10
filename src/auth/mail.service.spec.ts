import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

import * as nodemailer from 'nodemailer';

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('crée le transporteur nodemailer dans le constructeur', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: false }),
    );
  });

  describe('sendPasswordReset()', () => {
    it('envoie l\'email de réinitialisation avec le bon sujet', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      await service.sendPasswordReset('user@example.com', '123456');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Code de réinitialisation ShareLife',
        }),
      );
    });

    it('inclut le code dans le corps HTML', async () => {
      mockSendMail.mockResolvedValue({});

      await service.sendPasswordReset('user@example.com', '987654');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain('987654');
    });

    it('propage l\'erreur si sendMail échoue', async () => {
      const error = new Error('SMTP connection refused');
      mockSendMail.mockRejectedValue(error);

      await expect(service.sendPasswordReset('user@example.com', '000000')).rejects.toThrow(
        'SMTP connection refused',
      );
    });
  });
});
