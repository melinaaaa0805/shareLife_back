import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupInvitation } from './entities/group-invitation.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../group-member/entities/group-member.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class GroupInvitationsService {
  constructor(
    @InjectRepository(GroupInvitation)
    private invitationRepo: Repository<GroupInvitation>,
    @InjectRepository(Group)
    private groupRepo: Repository<Group>,
    @InjectRepository(GroupMember)
    private memberRepo: Repository<GroupMember>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async sendInvitation(groupId: string, invitedById: string, email: string) {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['owner'],
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    const invitedUser = await this.userRepo.findOne({ where: { email } });
    if (!invitedUser) throw new NotFoundException('Aucun compte trouvé avec cet email');

    // Ne pas inviter le créateur du groupe
    if (invitedUser.id === group.owner.id) {
      throw new ConflictException('Cet utilisateur est déjà propriétaire du groupe');
    }

    // Ne pas inviter quelqu'un déjà membre
    const alreadyMember = await this.memberRepo.findOne({
      where: { group: { id: groupId }, user: { id: invitedUser.id } },
    });
    if (alreadyMember) throw new ConflictException('Cet utilisateur est déjà membre du groupe');

    // Ne pas envoyer deux invitations PENDING
    const pending = await this.invitationRepo.findOne({
      where: {
        group: { id: groupId },
        invitedUser: { id: invitedUser.id },
        status: 'PENDING',
      },
    });
    if (pending) throw new ConflictException('Une invitation est déjà en attente pour cet utilisateur');

    const invitedBy = await this.userRepo.findOne({ where: { id: invitedById } });
    if (!invitedBy) throw new NotFoundException('Expéditeur introuvable');

    const invitation = this.invitationRepo.create({
      group,
      invitedUser,
      invitedBy,
      status: 'PENDING',
    });

    const saved = await this.invitationRepo.save(invitation);
    return {
      id: saved.id,
      status: saved.status,
      group: { id: group.id, name: group.name },
      invitedUser: { id: invitedUser.id, firstName: invitedUser.firstName, email: invitedUser.email },
    };
  }

  async getMyInvitations(userId: string) {
    const invitations = await this.invitationRepo.find({
      where: { invitedUser: { id: userId }, status: 'PENDING' },
      relations: ['group', 'group.owner', 'invitedBy'],
      order: { createdAt: 'DESC' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      status: inv.status,
      createdAt: inv.createdAt,
      group: {
        id: inv.group.id,
        name: inv.group.name,
      },
      invitedBy: {
        id: inv.invitedBy.id,
        firstName: inv.invitedBy.firstName,
        email: inv.invitedBy.email,
      },
    }));
  }

  async respondToInvitation(invitationId: string, userId: string, accept: boolean) {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId },
      relations: ['invitedUser', 'group'],
    });

    if (!invitation) throw new NotFoundException('Invitation non trouvée');
    if (invitation.invitedUser.id !== userId) throw new ForbiddenException('Cette invitation ne vous appartient pas');
    if (invitation.status !== 'PENDING') throw new ConflictException('Cette invitation a déjà été traitée');

    if (accept) {
      // Ajouter comme membre
      const member = this.memberRepo.create({
        group: invitation.group,
        user: invitation.invitedUser,
      });
      await this.memberRepo.save(member);
      invitation.status = 'ACCEPTED';
    } else {
      invitation.status = 'DECLINED';
    }

    await this.invitationRepo.save(invitation);
    return { success: true, status: invitation.status };
  }
}
