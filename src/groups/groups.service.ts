import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GroupMember } from '../group-member/entities/group-member.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createGroup(dto: CreateGroupDto, owner: User): Promise<Group> {
    const group = this.groupRepository.create({
      ...dto,
      owner,
    });
    return this.groupRepository.save(group);
  }

  async updateGroup(id: string, dto: UpdateGroupDto): Promise<Group> {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Groupe non trouvé');
    Object.assign(group, dto);
    return this.groupRepository.save(group);
  }

  async deleteGroup(id: string): Promise<void> {
    const result = await this.groupRepository.delete(id);
    if (!result.affected) throw new NotFoundException('Groupe non trouvé');
  }

  async addMember(groupId: string, dto: AddMemberDto): Promise<GroupMember> {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const existing = await this.groupMemberRepository.findOne({
      where: { group: { id: groupId }, user: { id: dto.userId } },
    });
    if (existing) return existing; // éviter doublon

    const member = this.groupMemberRepository.create({ group, user });
    return this.groupMemberRepository.save(member);
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const result = await this.groupMemberRepository.delete({
      group: { id: groupId },
      user: { id: userId },
    });
    if (!result.affected) throw new NotFoundException('Membre non trouvé dans le groupe');
  }
}
