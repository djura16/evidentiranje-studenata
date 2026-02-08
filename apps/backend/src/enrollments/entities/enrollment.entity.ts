import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity()
@Unique(['studentId', 'subjectId'])
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  studentId: string;

  @ManyToOne(() => User, (user) => user.enrollments)
  student: User;

  @Column()
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.enrollments)
  subject: Subject;

  @CreateDateColumn()
  enrolledAt: Date;
}
