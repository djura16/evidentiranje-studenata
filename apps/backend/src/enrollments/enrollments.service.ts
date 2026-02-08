import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '@evidentiranje/shared';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentsRepository: Repository<Enrollment>,
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async enroll(studentId: string, subjectId: string): Promise<Enrollment> {
    const student = await this.usersRepository.findOne({
      where: { id: studentId },
    });

    if (!student || student.role !== UserRole.STUDENT) {
      throw new NotFoundException('Student nije pronađen');
    }

    const subject = await this.subjectsRepository.findOne({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Predmet nije pronađen');
    }

    // Check if already enrolled
    const existing = await this.enrollmentsRepository.findOne({
      where: { studentId, subjectId },
    });

    if (existing) {
      throw new BadRequestException('Već ste upisani na ovaj predmet');
    }

    const enrollment = this.enrollmentsRepository.create({
      studentId,
      subjectId,
    });

    return this.enrollmentsRepository.save(enrollment);
  }

  async unenroll(studentId: string, subjectId: string): Promise<void> {
    const enrollment = await this.enrollmentsRepository.findOne({
      where: { studentId, subjectId },
    });

    if (!enrollment) {
      throw new NotFoundException('Niste upisani na ovaj predmet');
    }

    await this.enrollmentsRepository.remove(enrollment);
  }

  async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
    return this.enrollmentsRepository.find({
      where: { studentId },
      relations: ['subject', 'subject.teacher'],
    });
  }

  async getSubjectEnrollments(
    subjectId: string,
    currentUser: User,
  ): Promise<Enrollment[]> {
    const subject = await this.subjectsRepository.findOne({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Predmet nije pronađen');
    }

    // Only teacher of the subject or admin can see enrollments
    if (
      currentUser.role !== UserRole.ADMIN &&
      subject.teacherId !== currentUser.id
    ) {
      throw new UnauthorizedException(
        'Nemate pravo da vidite upisane studente',
      );
    }

    return this.enrollmentsRepository.find({
      where: { subjectId },
      relations: ['student'],
    });
  }

  async getAllAvailableSubjects(): Promise<Subject[]> {
    return this.subjectsRepository.find({
      relations: ['teacher'],
      order: { name: 'ASC' },
    });
  }
}
