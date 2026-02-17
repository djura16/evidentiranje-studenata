import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { SubjectSchedule } from './entities/subject-schedule.entity';
import { SubjectTeacher } from './entities/subject-teacher.entity';
import { ClassSession } from '../classes/entities/class-session.entity';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '@evidentiranje/shared';
import { CreateSubjectDto, SemesterType } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    @InjectRepository(SubjectSchedule)
    private schedulesRepository: Repository<SubjectSchedule>,
    @InjectRepository(SubjectTeacher)
    private subjectTeachersRepository: Repository<SubjectTeacher>,
    @InjectRepository(ClassSession)
    private classSessionsRepository: Repository<ClassSession>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto, currentUser: User): Promise<Subject> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Samo admin može kreirati predmet');
    }

    const {
      schedules,
      semesterStartDate,
      semesterEndDate,
      semesterType,
      academicYearStart,
      teacherId,
      teacherIds,
      ...subjectData
    } = createSubjectDto;

    const allTeacherIds = teacherIds?.length
      ? [...new Set(teacherIds)]
      : teacherId
        ? [teacherId]
        : [];
    if (allTeacherIds.length === 0) {
      throw new UnauthorizedException('Morate dodeliti bar jednog profesora predmetu');
    }

    const { start: computedStart, end: computedEnd } =
      this.getSemesterDates(semesterType, academicYearStart, semesterStartDate, semesterEndDate);

    const subject = this.subjectsRepository.create({
      ...subjectData,
      teacherId: allTeacherIds[0],
      semesterStartDate: computedStart ? new Date(computedStart) : undefined,
      semesterEndDate: computedEnd ? new Date(computedEnd) : undefined,
      semesterType: semesterType || undefined,
      academicYearStart: academicYearStart || undefined,
    });

    const savedSubject = await this.subjectsRepository.save(subject);

    for (const tid of allTeacherIds) {
      const st = this.subjectTeachersRepository.create({
        subjectId: savedSubject.id,
        teacherId: tid,
      });
      await this.subjectTeachersRepository.save(st);
    }

    if (schedules && schedules.length > 0) {
      for (const s of schedules) {
        const schedule = this.schedulesRepository.create({
          subjectId: savedSubject.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          durationMinutes: s.durationMinutes,
          repeatsWeekly: s.repeatsWeekly ?? true,
        });
        await this.schedulesRepository.save(schedule);
      }

      if (computedStart && computedEnd) {
        await this.generateClassSessions(
          savedSubject.id,
          schedules,
          computedStart,
          computedEnd,
        );
      }
    }

    return this.findOne(savedSubject.id);
  }

  private getSemesterDates(
    semesterType?: SemesterType,
    academicYearStart?: number,
    manualStart?: string,
    manualEnd?: string,
  ): { start: string | null; end: string | null } {
    if (semesterType && academicYearStart) {
      const y = academicYearStart;
      const yNext = academicYearStart + 1;
      if (semesterType === SemesterType.WINTER) {
        return {
          start: `${y}-10-01`,
          end: `${yNext}-01-31`,
        };
      }
      if (semesterType === SemesterType.SUMMER) {
        return {
          start: `${yNext}-02-01`,
          end: `${yNext}-06-30`,
        };
      }
    }
    if (manualStart && manualEnd) {
      return { start: manualStart, end: manualEnd };
    }
    return { start: null, end: null };
  }

  private async generateClassSessions(
    subjectId: string,
    schedules: { dayOfWeek: number; startTime: string; durationMinutes: number }[],
    semesterStart: string,
    semesterEnd: string,
  ): Promise<void> {
    const startDate = new Date(semesterStart + 'T00:00:00');
    const endDate = new Date(semesterEnd + 'T23:59:59');
    const classSessions: ClassSession[] = [];

    for (const s of schedules) {
      const jsDayOfWeek = s.dayOfWeek === 7 ? 0 : s.dayOfWeek;
      const [hours, minutes] = s.startTime.split(':').map(Number);

      const d = new Date(startDate.getTime());
      while (d <= endDate) {
        if (d.getDay() === jsDayOfWeek) {
          const startTime = new Date(d);
          startTime.setHours(hours, minutes, 0, 0);
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + s.durationMinutes);

          classSessions.push(
            this.classSessionsRepository.create({
              subjectId,
              startTime,
              endTime,
            }),
          );
        }
        d.setDate(d.getDate() + 1);
      }
    }

    if (classSessions.length > 0) {
      await this.classSessionsRepository.save(classSessions);
    }
  }

  async findAll(currentUser: User): Promise<Subject[]> {
    if (currentUser.role === UserRole.TEACHER) {
      const subjects = await this.subjectsRepository
        .createQueryBuilder('s')
        .leftJoinAndSelect('s.teacher', 'teacher')
        .leftJoinAndSelect('s.schedules', 'schedules')
        .leftJoinAndSelect('s.subjectTeachers', 'st')
        .leftJoinAndSelect('st.teacher', 'stTeacher')
        .where('s.teacherId = :teacherId OR st.teacherId = :teacherId', {
          teacherId: currentUser.id,
        })
        .distinct(true)
        .getMany();
      return subjects;
    }
    return this.subjectsRepository.find({
      relations: ['teacher', 'schedules', 'subjectTeachers', 'subjectTeachers.teacher'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.subjectsRepository.findOne({
      where: { id },
      relations: ['teacher', 'subjectTeachers', 'subjectTeachers.teacher', 'classSessions', 'schedules'],
    });

    if (!subject) {
      throw new NotFoundException('Predmet nije pronađen');
    }

    return subject;
  }

  async update(
    id: string,
    updateSubjectDto: UpdateSubjectDto,
    currentUser: User,
  ): Promise<Subject> {
    const subject = await this.findOne(id);

    if (currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Samo admin može menjati predmete');
    }

    if (updateSubjectDto.name !== undefined) subject.name = updateSubjectDto.name;
    if (updateSubjectDto.description !== undefined)
      subject.description = updateSubjectDto.description;

    if (updateSubjectDto.teacherIds !== undefined) {
      await this.subjectTeachersRepository.delete({ subjectId: id });
      const teacherIds = [...new Set(updateSubjectDto.teacherIds)];
      if (teacherIds.length > 0) {
        subject.teacherId = teacherIds[0];
        for (const tid of teacherIds) {
          const st = this.subjectTeachersRepository.create({
            subjectId: id,
            teacherId: tid,
          });
          await this.subjectTeachersRepository.save(st);
        }
      }
    }

    return this.subjectsRepository.save(subject);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const subject = await this.findOne(id);

    if (
      currentUser.role !== UserRole.ADMIN &&
      subject.teacherId !== currentUser.id
    ) {
      throw new UnauthorizedException('Nemate pravo da brišete ovaj predmet');
    }

    await this.subjectsRepository.remove(subject);
  }
}
