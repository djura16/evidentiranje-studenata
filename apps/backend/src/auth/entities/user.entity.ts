import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';
import { SubjectTeacher } from '../../subjects/entities/subject-teacher.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { UserRole } from '@evidentiranje/shared';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  indexNumber: string;

  @Column({ type: 'int', nullable: true })
  enrollmentYear: number;

  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ nullable: true })
  avatar: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @OneToMany(() => Subject, (subject) => subject.teacher)
  subjects: Subject[];

  @OneToMany(() => SubjectTeacher, (st) => st.teacher)
  subjectTeacherAssignments: SubjectTeacher[];

  @OneToMany(() => Attendance, (attendance) => attendance.student)
  attendances: Attendance[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];
}
