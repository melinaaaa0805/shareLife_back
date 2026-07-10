import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async saveToken(userId: string, token: string): Promise<void> {
    await this.userRepo.update(userId, { pushToken: token });
  }

  async removeToken(userId: string): Promise<void> {
    await this.userRepo.update(userId, { pushToken: null });
  }

  async sendToUser(userId: string, title: string, body: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user?.pushToken) await this.send([user.pushToken], title, body);
  }

  async sendToUsers(userIds: string[], title: string, body: string): Promise<void> {
    if (!userIds.length) return;
    const users = await this.userRepo.find({ where: { id: In(userIds) } });
    const tokens = users.map((u) => u.pushToken).filter(Boolean) as string[];
    if (tokens.length) await this.send(tokens, title, body);
  }

  private async send(tokens: string[], title: string, body: string): Promise<void> {
    const valid = tokens.filter((t) => t.startsWith('ExponentPushToken['));
    if (!valid.length) return;
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          valid.map((to) => ({ to, title, body, sound: 'default' })),
        ),
      });
    } catch {
      // Non-bloquant — une erreur push ne doit jamais interrompre la réponse API
    }
  }
}
