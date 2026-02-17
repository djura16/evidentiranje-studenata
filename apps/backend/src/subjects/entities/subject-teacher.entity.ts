import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Subject } from './subject.entity';
import { User } from '../../auth/entities/user.entity';

@Entity()
@Unique(['subjectId', 'teacherId'])
export class SubjectTeacher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.subjectTeachers)
  @JoinColumn()
  subject: Subject;

  @Column()
  teacherId: string;

  @ManyToOne(() => User)
  @JoinColumn()
  teacher: User;
}
