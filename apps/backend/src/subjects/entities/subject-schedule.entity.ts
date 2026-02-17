import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Subject } from './subject.entity';

@Entity()
export class SubjectSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subjectId: string;

  @ManyToOne(() => Subject, (subject) => subject.schedules)
  subject: Subject;

  /** Dan u nedelji: 1=Ponedeljak, 7=Nedelja (ISO) */
  @Column({ type: 'tinyint' })
  dayOfWeek: number;

  /** Vreme početka u formatu HH:mm */
  @Column({ type: 'varchar', length: 5 })
  startTime: string;

  /** Trajanje u minutima */
  @Column({ type: 'int', default: 90 })
  durationMinutes: number;

  /** Da li se ponavlja svake nedelje */
  @Column({ default: true })
  repeatsWeekly: boolean;
}
