import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupMember } from '../group-member/entities/group-member.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskAssignment } from '../task-assignment/entities/task-assignment.entity';
import { defaultTasks } from '../tasks/tasks.seeds';
import { User } from '../users/entities/user.entity';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group, GroupMode } from './entities/group.entity';
function getISOWeekAndYear(date: Date): { week: number; year: number } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
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
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepository: Repository<TaskAssignment>,
  ) {}

  async createGroup(dto: CreateGroupDto, owner: User): Promise<Group> {
    const group = this.groupRepository.create({
      name: dto.name,
      owner,
    });
    const result = await this.groupRepository.save(group) as Group;
    await this.addDefaultTasksToGroup(result, owner);
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

    // 2️⃣ Liens membership → on récupère les groups avec leur owner
    const memberLinks = await this.groupMemberRepository.find({
      where: { user: { email } },
      relations: ['group', 'group.owner'],
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
          members: [
            // Créateur en premier s'il n'est pas déjà dans les membres
            ...(members.find((m: GroupMember) => m.user.id === group.owner?.id)
              ? []
              : group.owner
                ? [{ id: group.owner.id, email: group.owner.email, firstName: group.owner.firstName }]
                : []),
            ...members.map((m: GroupMember) => ({
              id: m.user.id,
              email: m.user.email,
              firstName: m.user.firstName,
            })),
          ],
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
      members: [
        // Créateur en premier s'il n'est pas déjà dans les membres
        ...(group.members.find((m) => m.user.id === group.owner.id)
          ? []
          : [
              {
                id: group.owner.id,
                email: group.owner.email,
                firstName: group.owner.firstName,
                profile: 'ADULT',
              },
            ]),
        ...group.members.map((m) => ({
          id: m.user.id,
          email: m.user.email,
          firstName: m.user.firstName,
          profile: String(m.profile ?? 'ADULT'),
        })),
      ],
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
    const allMembers = [group.owner, ...group.members.map((m) => m.user)];
    const winner = allMembers.find((u) => u.id === winnerId);
    if (!winner)
      throw new NotFoundException('Membre non trouvé dans le groupe');

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

  async setMemberProfile(
    groupId: string,
    userId: string,
    profile: 'ADULT' | 'CHILD',
  ): Promise<void> {
    // Le créateur du groupe n'a pas de ligne GroupMember — on le gère côté frontend
    const member = await this.groupMemberRepository.findOne({
      where: { group: { id: groupId }, user: { id: userId } },
    });
    if (!member) throw new NotFoundException('Membre non trouvé dans le groupe');
    member.profile = profile;
    await this.groupMemberRepository.save(member);
  }

  /**
   * Mode SMART : distribue les tâches non assignées de la semaine de façon équilibrée.
   * - Les tâches FAMILY → tous les membres (adultes + enfants) sont éligibles
   * - Les tâches ADULT  → adultes uniquement
   * - Les tâches ADULT_CHILD → on crée 2 assignations : 1 adulte + 1 enfant (si dispo)
   *
   * Algorithme de répartition par charge pondérée :
   *   score(membre) = Σ weight × (1 + min(duration, 120) / 60)  sur ses tâches déjà assignées
   * On attribue toujours au membre ayant le score le plus faible parmi les éligibles.
   */
  async smartAssign(
    groupId: string,
    weekNumber: number,
    year: number,
  ): Promise<{ assigned: number }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['owner', 'members', 'members.user'],
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    // Construire la liste complète des membres avec profil
    const membersWithProfile: { user: User; profile: 'ADULT' | 'CHILD' }[] = [];

    // Vérifier si le owner est déjà dans members
    const ownerInMembers = group.members.find((m) => m.user.id === group.owner.id);
    if (!ownerInMembers) {
      membersWithProfile.push({ user: group.owner, profile: 'ADULT' });
    }
    for (const gm of group.members) {
      membersWithProfile.push({
        user: gm.user,
        profile: gm.profile ?? 'ADULT',
      });
    }

    // Récupérer les tâches non assignées de la semaine
    const unassignedTasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignments', 'assignment')
      .leftJoin('task.group', 'group')
      .where('group.id = :groupId', { groupId })
      .andWhere('task.weekNumber = :weekNumber', { weekNumber })
      .andWhere('task.year = :year', { year })
      .andWhere('task.isTemplate = false')
      .andWhere('assignment.id IS NULL')
      .getMany();

    if (unassignedTasks.length === 0) return { assigned: 0 };

    // Score actuel de chaque membre (tâches déjà assignées cette semaine)
    const scores = new Map<string, number>();
    for (const m of membersWithProfile) {
      scores.set(m.user.id, 0);
    }

    const existingAssignments = await this.assignmentRepository
      .createQueryBuilder('a')
      .innerJoin('a.task', 'task')
      .innerJoin('a.user', 'user')
      .where('task.groupId = :groupId', { groupId })
      .andWhere('task.weekNumber = :weekNumber', { weekNumber })
      .andWhere('task.year = :year', { year })
      .select(['a.id', 'user.id', 'task.weight', 'task.duration'])
      .getMany();

    for (const a of existingAssignments) {
      const uid = (a.user as any).id as string;
      if (scores.has(uid)) {
        const w = (a.task as any).weight ?? 1;
        const d = (a.task as any).duration ?? 0;
        scores.set(uid, (scores.get(uid) ?? 0) + w * (1 + Math.min(d, 120) / 60));
      }
    }

    const addScore = (userId: string, task: Task) => {
      const w = task.weight ?? 1;
      const d = task.duration ?? 0;
      scores.set(userId, (scores.get(userId) ?? 0) + w * (1 + Math.min(d, 120) / 60));
    };

    const pickLowest = (eligible: typeof membersWithProfile) => {
      let best = eligible[0];
      let bestScore = scores.get(best.user.id) ?? 0;
      for (const m of eligible.slice(1)) {
        const s = scores.get(m.user.id) ?? 0;
        if (s < bestScore) { best = m; bestScore = s; }
      }
      return best;
    };

    const adults = membersWithProfile.filter((m) => m.profile === 'ADULT');
    const children = membersWithProfile.filter((m) => m.profile === 'CHILD');
    const all = membersWithProfile;

    const toSave: TaskAssignment[] = [];
    let assigned = 0;

    for (const task of unassignedTasks) {
      if (task.taskType === 'ADULT') {
        if (adults.length === 0) continue;
        const picked = pickLowest(adults);
        toSave.push(this.assignmentRepository.create({ task, user: picked.user, status: 'PENDING' }));
        addScore(picked.user.id, task);
        assigned++;
      } else if (task.taskType === 'ADULT_CHILD') {
        if (adults.length === 0) continue;
        const pickedAdult = pickLowest(adults);
        toSave.push(this.assignmentRepository.create({ task, user: pickedAdult.user, status: 'PENDING' }));
        addScore(pickedAdult.user.id, task);
        assigned++;
        if (children.length > 0) {
          const pickedChild = pickLowest(children);
          toSave.push(this.assignmentRepository.create({ task, user: pickedChild.user, status: 'PENDING' }));
          addScore(pickedChild.user.id, task);
        }
      } else {
        // FAMILY
        if (all.length === 0) continue;
        const picked = pickLowest(all);
        toSave.push(this.assignmentRepository.create({ task, user: picked.user, status: 'PENDING' }));
        addScore(picked.user.id, task);
        assigned++;
      }
    }

    if (toSave.length > 0) await this.assignmentRepository.save(toSave);
    return { assigned };
  }
}
