import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { ClassSession } from '../../classes/entities/class-session.entity';

@Entity()
@Unique(['studentId', 'classSessionId'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;

  @ManyToOne(() => User, (user) => user.attendances)
  student: User;

  @Column()
  classSessionId: string;

  @ManyToOne(() => ClassSession, (classSession) => classSession.attendances)
  classSession: ClassSession;

  @CreateDateColumn()
  timestamp: Date;
}
