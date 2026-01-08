import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupMember } from '../group-member/entities/group-member.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskAssignment } from '../task-assignment/entities/task-assignment.entity';
import { ShoppingList } from '../shopping-list/entities/shopping-list.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'sharelife_db',
  autoLoadEntities: true,
  entities: [User, Group, GroupMember, Task, TaskAssignment, ShoppingList],
  synchronize: true, // seulement pour dev
};
