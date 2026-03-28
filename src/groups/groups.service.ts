import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group, GroupMode } from './entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GroupMember } from '../group-member/entities/group-member.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { defaultTasks } from '../tasks/tasks.seeds';
import { Task } from '../tasks/entities/task.entity';
function getISOWeekAndYear(date: Date): { week: number; year: number } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: d.getFullYear() };
}

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async createGroup(dto: CreateGroupDto, owner: User): Promise<Group> {
    const group = this.groupRepository.create({
      ...dto,
      owner,
    });
    const result = this.groupRepository.save(group);
    await this.addDefaultTasksToGroup(group, owner);
    return result;
  }
  private async addDefaultTasksToGroup(group: Group, user: User) {
    const tasks = defaultTasks.map((task) => ({
      ...task,
      isTemplate: true,
      createdBy: user,
      group: group,
    }));
    await this.taskRepository.save(tasks);
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
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });
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
    if (!result.affected)
      throw new NotFoundException('Membre non trouvé dans le groupe');
  }
  async getGroupsForUser(email: string): Promise<GroupResponseDto[]> {
    // 1️⃣ Groupes dont je suis propriétaire
    const ownedGroups = await this.groupRepository.find({
      where: { owner: { email } },
      relations: ['owner'],
    });

    // 2️⃣ Liens membership → on récupère juste les groups (sans charger members ici)
    const memberLinks = await this.groupMemberRepository.find({
      where: { user: { email } },
      relations: ['group'],
    });

    const memberGroups = memberLinks.map((gm) => gm.group);

    // 3️⃣ Fusion sans doublons
    const allGroups = [
      ...ownedGroups,
      ...memberGroups.filter((g) => !ownedGroups.find((og) => og.id === g.id)),
    ];

    // 4️⃣ Pour chaque groupe, on charge ses membres dans la table intermédiaire
    const groupsWithMembers = await Promise.all(
      allGroups.map(async (group) => {
        const members = await this.groupMemberRepository.find({
          where: { group: { id: group.id } },
          relations: ['user'],
        });

        return {
          id: group.id,
          name: group.name,
          createdAt: group.createdAt,
          owner: group.owner
            ? {
                id: group.owner.id,
                email: group.owner.email,
                firstName: group.owner.firstName,
              }
            : null,
          members: members.map((m: GroupMember) => ({
            id: m.user.id,
            email: m.user.email,
            firstName: m.user.firstName,
          })),
        };
      }),
    );

    return groupsWithMembers;
  }

  async getGroupById(groupId: string) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['owner', 'members', 'members.user', 'task', 'weeklyAdmin'],
    });

    if (!group) {
      throw new NotFoundException('Groupe non trouvé');
    }

    const now = new Date();
    const { week: currentWeek, year: currentYear } = getISOWeekAndYear(now);
    const isAdminForThisWeek =
      group.weeklyAdminWeek === currentWeek &&
      group.weeklyAdminYear === currentYear;

    return {
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      mode: group.mode,
      weeklyAdmin:
        group.weeklyAdmin && isAdminForThisWeek
          ? {
              id: group.weeklyAdmin.id,
              email: group.weeklyAdmin.email,
              firstName: group.weeklyAdmin.firstName,
            }
          : null,
      owner: {
        id: group.owner.id,
        email: group.owner.email,
        firstName: group.owner.firstName,
      },
      members: group.members.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        firstName: m.user.firstName,
      })),
    };
  }

  async setMode(groupId: string, mode: GroupMode): Promise<void> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');
    group.mode = mode;
    await this.groupRepository.save(group);
  }

  async electWeeklyAdmin(
    groupId: string,
    winnerId: string,
  ): Promise<{ admin: { id: string; firstName: string; email: string } }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['members', 'members.user', 'owner'],
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');
    if (group.mode !== 'FUNNY')
      throw new ForbiddenException("Le groupe n'est pas en mode Drôle");

    // Vérifier que le winner fait partie du groupe
    const allMembers = [
      group.owner,
      ...group.members.map((m) => m.user),
    ];
    const winner = allMembers.find((u) => u.id === winnerId);
    if (!winner) throw new NotFoundException('Membre non trouvé dans le groupe');

    const now = new Date();
    const { week, year } = getISOWeekAndYear(now);
    group.weeklyAdmin = winner;
    group.weeklyAdminWeek = week;
    group.weeklyAdminYear = year;
    await this.groupRepository.save(group);

    return {
      admin: {
        id: winner.id,
        firstName: winner.firstName,
        email: winner.email,
      },
    };
  }

  async getWeeklyAdmin(groupId: string) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['weeklyAdmin'],
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    const now = new Date();
    const { week: currentWeek, year: currentYear } = getISOWeekAndYear(now);

    const isValid =
      group.weeklyAdmin &&
      group.weeklyAdminWeek === currentWeek &&
      group.weeklyAdminYear === currentYear;

    return {
      mode: group.mode,
      weeklyAdmin: isValid
        ? {
            id: group.weeklyAdmin!.id,
            firstName: group.weeklyAdmin!.firstName,
            email: group.weeklyAdmin!.email,
          }
        : null,
    };
  }
}
