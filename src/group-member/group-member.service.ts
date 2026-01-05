import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGroupMemberDto } from './dto/create-group-member.dto';
import { UpdateGroupMemberDto } from './dto/update-group-member.dto';
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
  create(createGroupMemberDto: CreateGroupMemberDto) {
    return 'This action adds a new groupMember';
  }

  findAll() {
    return `This action returns all groupMember`;
  }

  findOne(id: number) {
    return `This action returns a #${id} groupMember`;
  }

  update(id: number, updateGroupMemberDto: UpdateGroupMemberDto) {
    return `This action updates a #${id} groupMember`;
  }

  remove(id: number) {
    return `This action removes a #${id} groupMember`;
  }
  async addMemberByEmail(email: string, groupId: string): Promise<GroupMember> {
    // 1️⃣ Vérifier utilisateur
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // 2️⃣ Vérifier groupe
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // 3️⃣ Vérifier s’il est déjà membre
    const existingMember = await this.groupMemberRepository.findOne({
      where: {
        user: { id: user.id },
        group: { id: group.id },
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already member of this group');
    }
    // 4️⃣ Créer le lien
    const member = this.groupMemberRepository.create({
      user,
      group
     });

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
