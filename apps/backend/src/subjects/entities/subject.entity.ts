import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { ClassSession } from '../../classes/entities/class-session.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { SubjectSchedule } from './subject-schedule.entity';
import { SubjectTeacher } from './subject-teacher.entity';

@Entity()
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  teacherId: string;

  @ManyToOne(() => User, (user) => user.subjects, { nullable: true })
  teacher: User;

  @OneToMany(() => SubjectTeacher, (st) => st.subject)
  subjectTeachers: SubjectTeacher[];

  @Column({ type: 'date', nullable: true })
  semesterStartDate: Date;

  @Column({ type: 'date', nullable: true })
  semesterEndDate: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  semesterType: string;

  @Column({ type: 'int', nullable: true })
  academicYearStart: number;

  @OneToMany(() => SubjectSchedule, (schedule) => schedule.subject)
  schedules: SubjectSchedule[];

  @OneToMany(() => ClassSession, (classSession) => classSession.subject)
  classSessions: ClassSession[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.subject)
  enrollments: Enrollment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
