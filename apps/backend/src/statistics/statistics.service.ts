import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { ClassSession } from '../classes/entities/class-session.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { UserRole } from '@evidentiranje/shared';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    @InjectRepository(ClassSession)
    private classSessionsRepository: Repository<ClassSession>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

  async getDashboardStats(currentUser: User) {
    if (currentUser.role === UserRole.ADMIN) {
      return this.getAdminDashboard();
    } else if (currentUser.role === UserRole.TEACHER) {
      return this.getTeacherDashboard(currentUser);
    } else if (currentUser.role === UserRole.STUDENT) {
      return this.getStudentDashboard(currentUser);
    }
    throw new UnauthorizedException('Nepoznata uloga');
  }

  private async getAdminDashboard() {
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalAdmins,
      totalSubjects,
      totalClasses,
      totalAttendances,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { role: UserRole.TEACHER } }),
      this.usersRepository.count({ where: { role: UserRole.STUDENT } }),
      this.usersRepository.count({ where: { role: UserRole.ADMIN } }),
      this.subjectsRepository.count(),
      this.classSessionsRepository.count(),
      this.attendanceRepository.count(),
    ]);

    return {
      users: {
        total: totalUsers,
        teachers: totalTeachers,
        students: totalStudents,
        admins: totalAdmins,
      },
      subjects: {
        total: totalSubjects,
      },
      classes: {
        total: totalClasses,
      },
      attendances: {
        total: totalAttendances,
      },
    };
  }

  private async getTeacherDashboard(teacher: User) {
    const subjects = await this.subjectsRepository
      .createQueryBuilder('s')
      .distinct(true)
      .select('s.id', 'id')
      .addSelect('s.name', 'name')
      .leftJoin('s.subjectTeachers', 'st')
      .where('s.teacherId = :teacherId OR st.teacherId = :teacherId', {
        teacherId: teacher.id,
      })
      .getRawMany();

    const subjectIds = subjects.map((s) => s.id);

    const [totalClasses, totalAttendances] = await Promise.all([
      subjectIds.length > 0
        ? this.classSessionsRepository
            .createQueryBuilder('classSession')
            .where('classSession.subjectId IN (:...subjectIds)', {
              subjectIds,
            })
            .getCount()
        : 0,
      subjectIds.length > 0
        ? this.attendanceRepository
            .createQueryBuilder('attendance')
            .innerJoin('attendance.classSession', 'classSession')
            .where('classSession.subjectId IN (:...subjectIds)', {
              subjectIds,
            })
            .getCount()
        : 0,
    ]);

    return {
      subjects: {
        total: subjects.length,
        list: subjects.map((s) => ({
          id: s.id,
          name: s.name,
        })),
      },
      classes: {
        total: totalClasses,
      },
      attendances: {
        total: totalAttendances,
      },
    };
  }

  private async getStudentDashboard(student: User) {
    const [totalAttendances, totalClasses] = await Promise.all([
      this.attendanceRepository.count({
        where: { studentId: student.id },
      }),
      this.classSessionsRepository
        .createQueryBuilder('classSession')
        .getCount(),
    ]);

    const attendancePercentage =
      totalClasses > 0
        ? Math.round((totalAttendances / totalClasses) * 100)
        : 0;

    return {
      attendances: {
        total: totalAttendances,
        percentage: attendancePercentage,
      },
      classes: {
        total: totalClasses,
      },
    };
  }
}
