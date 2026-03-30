import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../group-member/entities/group-member.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskAssignment } from '../task-assignment/entities/task-assignment.entity';
import { ShoppingList } from '../shopping-list/entities/shopping-list.entity';
import { WeeklyMeal } from '../meals/entities/weekly-meal.entity';
import { MealVote } from '../meal-votes/entities/meal-vote.entity';
import { GroupInvitation } from '../group-invitations/entities/group-invitation.entity';
import { Expense } from '../finance/entities/expense.entity';
import { ExpenseParticipant } from '../finance/entities/expense-participant.entity';
import { Reimbursement } from '../finance/entities/reimbursement.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'sharelife_db',
  autoLoadEntities: true,
  entities: [User, Group, GroupMember, Task, TaskAssignment, ShoppingList, WeeklyMeal, MealVote, GroupInvitation, Expense, ExpenseParticipant, Reimbursement],
  synchronize: true, // seulement pour dev
};
