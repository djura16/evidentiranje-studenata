import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { ClassSession } from './entities/class-session.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { SubjectTeacher } from '../subjects/entities/subject-teacher.entity';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '@evidentiranje/shared';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassSession)
    private classSessionsRepository: Repository<ClassSession>,
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    @InjectRepository(SubjectTeacher)
    private subjectTeachersRepository: Repository<SubjectTeacher>,
    private configService: ConfigService,
  ) {}

  async create(
    createClassSessionDto: CreateClassSessionDto,
    currentUser: User,
  ): Promise<ClassSession> {
    const subject = await this.subjectsRepository.findOne({
      where: { id: createClassSessionDto.subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Predmet nije pronađen');
    }

    const isAssignedTeacher = await this.subjectTeachersRepository.findOne({
      where: { subjectId: subject.id, teacherId: currentUser.id },
    });
    const isTeacher =
      subject.teacherId === currentUser.id || !!isAssignedTeacher;
    if (currentUser.role !== UserRole.ADMIN && !isTeacher) {
      throw new UnauthorizedException('Nemate pravo da kreirate čas za ovaj predmet');
    }

    const classSession = this.classSessionsRepository.create({
      ...createClassSessionDto,
      subjectId: createClassSessionDto.subjectId,
    });

    return this.classSessionsRepository.save(classSession);
  }

  async findAll(
    currentUser: User,
    options?: {
      subjectId?: string;
      heldOnly?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<ClassSession[]> {
    const query = this.classSessionsRepository
      .createQueryBuilder('cs')
      .leftJoinAndSelect('cs.subject', 'subject')
      .orderBy('cs.startTime', 'DESC');

    if (currentUser.role === UserRole.TEACHER) {
      const teacherSubjects = await this.subjectsRepository
        .createQueryBuilder('s')
        .distinct(true)
        .select('s.id')
        .leftJoin('s.subjectTeachers', 'st')
        .where('s.teacherId = :teacherId OR st.teacherId = :teacherId', {
          teacherId: currentUser.id,
        })
        .getMany();
      const subjectIds = teacherSubjects.map((s) => s.id);
      if (subjectIds.length === 0) return [];
      if (options?.subjectId) {
        if (!subjectIds.includes(options.subjectId)) return [];
        query.andWhere('cs.subjectId = :subjectId', { subjectId: options.subjectId });
      } else {
        query.andWhere('cs.subjectId IN (:...subjectIds)', { subjectIds });
      }
    } else if (options?.subjectId) {
      query.andWhere('cs.subjectId = :subjectId', { subjectId: options.subjectId });
    }

    if (options?.heldOnly) {
      query.andWhere('(cs.endTime <= :now OR cs.isActive = 1)', {
        now: new Date(),
      });
    }

    if (options?.limit != null) query.take(options.limit);
    if (options?.offset != null) query.skip(options.offset);

    return query.getMany();
  }

  async countHeld(currentUser: User, subjectId?: string): Promise<number> {
    const query = this.classSessionsRepository
      .createQueryBuilder('cs')
      .where('(cs.endTime <= :now OR cs.isActive = 1)', { now: new Date() });

    if (currentUser.role === UserRole.TEACHER) {
      const teacherSubjects = await this.subjectsRepository
        .createQueryBuilder('s')
        .distinct(true)
        .select('s.id')
        .leftJoin('s.subjectTeachers', 'st')
        .where('s.teacherId = :teacherId OR st.teacherId = :teacherId', {
          teacherId: currentUser.id,
        })
        .getMany();
      const subjectIds = teacherSubjects.map((s) => s.id);
      if (subjectIds.length === 0) return 0;
      if (subjectId) {
        if (!subjectIds.includes(subjectId)) return 0;
        query.andWhere('cs.subjectId = :subjectId', { subjectId });
      } else {
        query.andWhere('cs.subjectId IN (:...subjectIds)', { subjectIds });
      }
    } else if (subjectId) {
      query.andWhere('cs.subjectId = :subjectId', { subjectId });
    }

    return query.getCount();
  }

  async findOne(id: string): Promise<ClassSession> {
    const classSession = await this.classSessionsRepository.findOne({
      where: { id },
      relations: ['subject', 'attendances', 'attendances.student'],
    });

    if (!classSession) {
      throw new NotFoundException('Čas nije pronađen');
    }

    // Automatska deaktivacija kada QR kod istekne
    if (
      classSession.isActive &&
      classSession.expiresAt &&
      new Date() > new Date(classSession.expiresAt)
    ) {
      classSession.isActive = false;
      classSession.qrCodeToken = null;
      classSession.expiresAt = null;
      return this.classSessionsRepository.save(classSession);
    }

    return classSession;
  }

  async update(
    id: string,
    updateClassSessionDto: UpdateClassSessionDto,
    currentUser: User,
  ): Promise<ClassSession> {
    const classSession = await this.findOne(id);
    const subject = await this.subjectsRepository.findOne({
      where: { id: classSession.subjectId },
      relations: ['subjectTeachers'],
    });

    const isAssignedTeacher = subject.subjectTeachers?.some(
      (st) => st.teacherId === currentUser.id,
    );
    const isTeacher = subject.teacherId === currentUser.id || isAssignedTeacher;

    if (currentUser.role !== UserRole.ADMIN && !isTeacher) {
      throw new UnauthorizedException('Nemate pravo da menjate ovaj čas');
    }

    Object.assign(classSession, updateClassSessionDto);
    return this.classSessionsRepository.save(classSession);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const classSession = await this.findOne(id);
    const subject = await this.subjectsRepository.findOne({
      where: { id: classSession.subjectId },
      relations: ['subjectTeachers'],
    });

    const isAssignedTeacher = subject.subjectTeachers?.some(
      (st) => st.teacherId === currentUser.id,
    );
    const isTeacher = subject.teacherId === currentUser.id || isAssignedTeacher;

    if (currentUser.role !== UserRole.ADMIN && !isTeacher) {
      throw new UnauthorizedException('Nemate pravo da brišete ovaj čas');
    }

    await this.classSessionsRepository.remove(classSession);
  }

  async activateClass(
    id: string,
    currentUser: User,
    expirationMinutes?: number,
  ): Promise<ClassSession> {
    const classSession = await this.findOne(id);
    const subject = await this.subjectsRepository.findOne({
      where: { id: classSession.subjectId },
      relations: ['subjectTeachers'],
    });

    const isAssignedTeacher = subject.subjectTeachers?.some(
      (st) => st.teacherId === currentUser.id,
    );
    const isTeacher = subject.teacherId === currentUser.id || isAssignedTeacher;

    if (currentUser.role !== UserRole.ADMIN && !isTeacher) {
      throw new UnauthorizedException('Nemate pravo da aktivirate ovaj čas');
    }

    if (classSession.isActive) {
      throw new BadRequestException('Čas je već aktivan');
    }

    // Profesor može aktivirati samo ako je u vremenskom okviru: 15 min pre početka do kraja časa
    const now = new Date();
    const startTime = new Date(classSession.startTime);
    const endTime = new Date(classSession.endTime);
    const activationWindowStart = new Date(startTime);
    activationWindowStart.setMinutes(activationWindowStart.getMinutes() - 15);

    if (now < activationWindowStart) {
      throw new BadRequestException(
        'Ne možete aktivirati čas - još nije vreme. Možete aktivirati najranije 15 minuta pre početka časa.',
      );
    }
    if (now > endTime) {
      throw new BadRequestException(
        'Ne možete aktivirati čas - vreme časa je već prošlo.',
      );
    }

    // Generate QR code token
    const qrCodeToken = uuidv4();
    // Use provided expirationMinutes or fallback to config/default
    const finalExpirationMinutes =
      expirationMinutes ||
      parseInt(this.configService.get('QR_CODE_EXPIRATION_MINUTES') || '2', 10) ||
      2;
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + finalExpirationMinutes);

    classSession.qrCodeToken = qrCodeToken;
    classSession.isActive = true;
    classSession.expiresAt = expiresAt;

    const saved = await this.classSessionsRepository.save(classSession);

    const baseUrl = this.configService.get('QR_CODE_BASE_URL') || 'http://localhost:3000/attend?token=';
    return {
      ...saved,
      qrCodeUrl: `${baseUrl}${qrCodeToken}`,
    } as any;
  }

  async deactivateClass(id: string, currentUser: User): Promise<ClassSession> {
    const classSession = await this.findOne(id);
    const subject = await this.subjectsRepository.findOne({
      where: { id: classSession.subjectId },
      relations: ['subjectTeachers'],
    });

    const isAssignedTeacher = subject.subjectTeachers?.some(
      (st) => st.teacherId === currentUser.id,
    );
    const isTeacher = subject.teacherId === currentUser.id || isAssignedTeacher;

    if (currentUser.role !== UserRole.ADMIN && !isTeacher) {
      throw new UnauthorizedException('Nemate pravo da deaktivirate ovaj čas');
    }

    classSession.isActive = false;
    classSession.qrCodeToken = null;
    classSession.expiresAt = null;

    return this.classSessionsRepository.save(classSession);
  }
}
