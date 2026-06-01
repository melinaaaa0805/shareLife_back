import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export interface UpdateProfileDto {
  firstName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  avatarColor?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Utilisateur ${id} non trouvé`);
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.findOne(id);

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new UnauthorizedException(
          'Le mot de passe actuel est requis pour en définir un nouveau',
        );
      }
      const valid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!valid) {
        throw new UnauthorizedException('Mot de passe actuel incorrect');
      }
      user.password = await bcrypt.hash(dto.newPassword, 10);
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) throw new ConflictException('Cet email est déjà utilisé');
      user.email = dto.email;
    }

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.avatarColor !== undefined) user.avatarColor = dto.avatarColor;

    await this.userRepository.save(user);

    return {
      id: user.id,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      avatarColor: user.avatarColor,
    };
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.findOne(userId);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Mot de passe incorrect');

    // Delete groups owned by the user first (FK Group.owner → User has no CASCADE)
    const ownedGroups = await this.groupRepository.find({
      where: { owner: { id: userId } },
    });
    for (const group of ownedGroups) {
      await this.groupRepository.delete(group.id);
    }

    // Delete the user — remaining memberships cascade via DB (GroupMember.user onDelete: CASCADE)
    await this.userRepository.delete(userId);
  }
}
