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

  async addMemberByEmail(email: string, groupId: string): Promise<GroupMember> {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const existing = await this.groupMemberRepository.findOne({
      where: { group: { id: groupId }, user: { id: user.id } },
    });
    if (existing) return existing;

    const member = this.groupMemberRepository.create({ group, user });
    return this.groupMemberRepository.save(member);
  }

  async getUsersByGroup(groupId: string): Promise<User[]> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['owner'],
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    const members = await this.groupMemberRepository.find({
      where: { group: { id: groupId } },
      relations: ['user'],
    });

    const users = members.map((m) => m.user);

    if (group.owner && !users.find((u) => u.id === group.owner.id)) {
      users.unshift(group.owner);
    }

    return users;
  }
}
