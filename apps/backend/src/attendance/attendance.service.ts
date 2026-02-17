import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { ClassSession } from '../classes/entities/class-session.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { User } from '../auth/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { UserRole } from '@evidentiranje/shared';
import { AttendanceGateway } from './attendance.gateway';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(ClassSession)
    private classSessionsRepository: Repository<ClassSession>,
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private enrollmentsRepository: Repository<Enrollment>,
    private attendanceGateway: AttendanceGateway,
  ) {}

  async scanQrCode(token: string, currentUser: User): Promise<Attendance> {
    if (currentUser.role !== UserRole.STUDENT) {
      throw new UnauthorizedException('Samo studenti mogu skenirati QR kod');
    }

    const classSession = await this.classSessionsRepository.findOne({
      where: { qrCodeToken: token },
      relations: ['subject'],
    });

    if (!classSession) {
      throw new NotFoundException('QR kod nije validan');
    }

    if (!classSession.isActive) {
      throw new BadRequestException('Čas nije aktivan');
    }

    if (classSession.expiresAt && new Date() > classSession.expiresAt) {
      // Automatska deaktivacija kada student pokuša da skenira istekao QR
      classSession.isActive = false;
      classSession.qrCodeToken = null;
      classSession.expiresAt = null;
      await this.classSessionsRepository.save(classSession);
      throw new BadRequestException('QR kod je istekao');
    }

    // Check if student is enrolled in the subject
    const enrollment = await this.enrollmentsRepository.findOne({
      where: {
        studentId: currentUser.id,
        subjectId: classSession.subjectId,
      },
    });

    if (!enrollment) {
      throw new BadRequestException(
        'Niste upisani na ovaj predmet. Molimo vas da se prvo upišete.',
      );
    }

    // Check if attendance already exists
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        studentId: currentUser.id,
        classSessionId: classSession.id,
      },
    });

    if (existingAttendance) {
      throw new BadRequestException('Prisustvo je već evidentirano');
    }

    const attendance = this.attendanceRepository.create({
      studentId: currentUser.id,
      classSessionId: classSession.id,
    });

    try {
      const saved = await this.attendanceRepository.save(attendance);
      const loaded = await this.attendanceRepository.findOne({
        where: { id: saved.id },
        relations: ['student'],
      });
      if (loaded) {
        this.attendanceGateway.emitNewAttendance(classSession.id, {
          id: loaded.id,
          studentId: loaded.studentId,
          classSessionId: loaded.classSessionId,
          timestamp: loaded.timestamp.toISOString(),
          student: loaded.student
            ? {
                id: loaded.student.id,
                firstName: loaded.student.firstName,
                lastName: loaded.student.lastName,
                email: loaded.student.email,
                indexNumber: loaded.student.indexNumber,
              }
            : undefined,
        });
      }
      return loaded || saved;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new BadRequestException('Prisustvo je već evidentirano');
      }
      throw error;
    }
  }

  async getMyAttendance(currentUser: User): Promise<Attendance[]> {
    if (currentUser.role !== UserRole.STUDENT) {
      throw new UnauthorizedException('Samo studenti mogu videti svoje prisustvo');
    }

    return this.attendanceRepository.find({
      where: { studentId: currentUser.id },
      relations: ['classSession', 'classSession.subject'],
      order: { timestamp: 'DESC' },
    });
  }

  async getClassAttendance(
    classSessionId: string,
    currentUser: User,
  ): Promise<Attendance[]> {
    const classSession = await this.classSessionsRepository.findOne({
      where: { id: classSessionId },
      relations: ['subject', 'subject.subjectTeachers'],
    });

    if (!classSession) {
      throw new NotFoundException('Čas nije pronađen');
    }

    const subject = classSession.subject;
    const isAssignedTeacher = subject.subjectTeachers?.some(
      (st) => st.teacherId === currentUser.id,
    );
    const isTeacher =
      subject.teacherId === currentUser.id || isAssignedTeacher;

    if (currentUser.role !== UserRole.ADMIN && !isTeacher) {
      throw new UnauthorizedException(
        'Nemate pravo da vidite prisustvo za ovaj čas',
      );
    }

    return this.attendanceRepository.find({
      where: { classSessionId },
      relations: ['student', 'classSession'],
      order: { timestamp: 'ASC' },
    });
  }

  async getStudentAttendance(
    studentId: string,
    currentUser: User,
  ): Promise<Attendance[]> {
    // Students can only see their own attendance
    if (
      currentUser.role === UserRole.STUDENT &&
      currentUser.id !== studentId
    ) {
      throw new UnauthorizedException('Možete videti samo svoje prisustvo');
    }

    return this.attendanceRepository.find({
      where: { studentId },
      relations: ['classSession', 'classSession.subject'],
      order: { timestamp: 'DESC' },
    });
  }

  async getAttendanceStatistics(
    subjectId: string,
    currentUser: User,
  ): Promise<any> {
    if (currentUser.role !== UserRole.ADMIN) {
      if (currentUser.role !== UserRole.TEACHER) {
        throw new UnauthorizedException('Nemate pravo da vidite statistiku');
      }
      const subject = await this.subjectsRepository
        .createQueryBuilder('s')
        .leftJoin('s.subjectTeachers', 'st')
        .where('s.id = :subjectId', { subjectId })
        .andWhere('(s.teacherId = :teacherId OR st.teacherId = :teacherId)', {
          teacherId: currentUser.id,
        })
        .getOne();
      if (!subject) {
        throw new UnauthorizedException(
          'Nemate pravo da vidite statistiku za ovaj predmet',
        );
      }
    }

    const classSessions = await this.classSessionsRepository.find({
      where: { subjectId },
    });

    const totalClasses = classSessions.length;
    const attendances = await this.attendanceRepository.find({
      where: {
        classSession: { subjectId },
      },
      relations: ['student', 'classSession'],
    });

    // Group by student
    const studentStats = new Map<string, { count: number; student: User }>();

    for (const attendance of attendances) {
      const studentId = attendance.studentId;
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          count: 0,
          student: attendance.student,
        });
      }
      studentStats.get(studentId).count++;
    }

    // Za svakog studenta - lista datuma kada je prisustvovao
    const studentAttendanceDates = new Map<
      string,
      { student: User; classDates: Date[] }
    >();
    for (const att of attendances) {
      const studentId = att.studentId;
      if (!studentAttendanceDates.has(studentId)) {
        studentAttendanceDates.set(studentId, {
          student: att.student,
          classDates: [],
        });
      }
      const sessionStart = new Date(att.classSession.startTime);
      studentAttendanceDates.get(studentId)!.classDates.push(sessionStart);
    }

    const statistics = Array.from(studentStats.entries()).map(
      ([studentId, stat]) => {
        const datesInfo = studentAttendanceDates.get(studentId);
        return {
          student: {
            id: stat.student.id,
            firstName: stat.student.firstName,
            lastName: stat.student.lastName,
            email: stat.student.email,
            indexNumber: stat.student.indexNumber,
          },
          attendedClasses: stat.count,
          totalClasses,
          attendancePercentage:
            totalClasses > 0
              ? Math.round((stat.count / totalClasses) * 100)
              : 0,
          attendedDates: datesInfo
            ? datesInfo.classDates
                .sort((a, b) => a.getTime() - b.getTime())
                .map((d) => d.toISOString().split('T')[0])
            : [],
        };
      },
    );

    const allClassDates = classSessions
      .map((cs) => new Date(cs.startTime).toISOString().split('T')[0])
      .sort();

    return {
      subjectId,
      totalClasses,
      statistics,
      classDates: allClassDates,
    };
  }
}
