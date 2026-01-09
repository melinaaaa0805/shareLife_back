import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupMember } from './entities/group-member.entity';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class GroupMemberService {
  constructor(
    @InjectRepository(GroupMember)
    private groupMemberRepository: Repository<GroupMember>,

    @InjectRepository(Group)
    private groupRepository: Repository<Group>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  findAll() {
    return `This action returns all groupMember`;
  }

  findOne(id: number) {
    return `This action returns a #${id} groupMember`;
  }

  remove(id: number) {
    return `This action removes a #${id} groupMember`;
  }
  async addMemberByEmail(email: string, groupId: string): Promise<GroupMember> {
    // 1️⃣ Vérifier utilisateur
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    const user = await this.userRepository.findOne({
      where: { email: email },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const existing = await this.groupMemberRepository.findOne({
      where: { group: { id: groupId }, user: { id: user.id } },
    });
    if (existing) return existing; // éviter doublon

    const member = this.groupMemberRepository.create({ group, user });
    return this.groupMemberRepository.save(member);
  }
  /**
   * Récupère tous les utilisateurs d'un groupe
   * @param groupId id du groupe
   * @returns liste des utilisateurs
   */
  async getUsersByGroup(groupId: string): Promise<User[]> {
    const members = await this.groupMemberRepository.find({
      where: { group: { id: groupId } },
      relations: ['user'],
    });

    if (!members.length) {
      throw new NotFoundException('Aucun membre trouvé pour ce groupe');
    }

    // Retourne uniquement les utilisateurs
    return members.map((m) => m.user);
  }
}
