import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';

@Entity()
export class ClassSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.classSessions)
  subject: Subject;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column({ nullable: true, unique: true })
  qrCodeToken: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date;

  @OneToMany(() => Attendance, (attendance) => attendance.classSession)
  attendances: Attendance[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
