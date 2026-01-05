export class CreateTaskDto {
  title: string;
  description?: string;
  weight?: number;
  frequency?: 'ONCE' | 'DAILY' | 'WEEKLY';
  dueDate?: Date;
  time?: string;
  groupId: string;
  userId: string;
}