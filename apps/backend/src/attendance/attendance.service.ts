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
import { User } from '../auth/entities/user.entity';
import { UserRole } from '@evidentiranje/shared';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(ClassSession)
    private classSessionsRepository: Repository<ClassSession>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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
      throw new BadRequestException('QR kod je istekao');
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

    return this.attendanceRepository.save(attendance);
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
      relations: ['subject'],
    });

    if (!classSession) {
      throw new NotFoundException('Čas nije pronađen');
    }

    // Only teacher of the subject or admin can see attendance
    if (
      currentUser.role !== UserRole.ADMIN &&
      classSession.subject.teacherId !== currentUser.id
    ) {
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
    // Only teachers and admins can see statistics
    if (
      currentUser.role !== UserRole.TEACHER &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new UnauthorizedException('Nemate pravo da vidite statistiku');
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

    const statistics = Array.from(studentStats.values()).map((stat) => ({
      student: {
        id: stat.student.id,
        firstName: stat.student.firstName,
        lastName: stat.student.lastName,
        email: stat.student.email,
      },
      attendedClasses: stat.count,
      totalClasses,
      attendancePercentage:
        totalClasses > 0 ? Math.round((stat.count / totalClasses) * 100) : 0,
    }));

    return {
      subjectId,
      totalClasses,
      statistics,
    };
  }
}
