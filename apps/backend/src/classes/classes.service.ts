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

    if (
      currentUser.role !== UserRole.ADMIN &&
      subject.teacherId !== currentUser.id
    ) {
      throw new UnauthorizedException('Nemate pravo da kreirate čas za ovaj predmet');
    }

    const classSession = this.classSessionsRepository.create({
      ...createClassSessionDto,
      subjectId: createClassSessionDto.subjectId,
    });

    return this.classSessionsRepository.save(classSession);
  }

  async findAll(currentUser: User, subjectId?: string): Promise<ClassSession[]> {
    const where: any = {};
    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (currentUser.role === UserRole.TEACHER) {
      // Teachers see classes for their subjects
      const subjects = await this.subjectsRepository.find({
        where: { teacherId: currentUser.id },
      });
      where.subjectId = subjects.map((s) => s.id);
    }

    return this.classSessionsRepository.find({
      where,
      relations: ['subject'],
      order: { startTime: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ClassSession> {
    const classSession = await this.classSessionsRepository.findOne({
      where: { id },
      relations: ['subject', 'attendances', 'attendances.student'],
    });

    if (!classSession) {
      throw new NotFoundException('Čas nije pronađen');
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
    });

    if (
      currentUser.role !== UserRole.ADMIN &&
      subject.teacherId !== currentUser.id
    ) {
      throw new UnauthorizedException('Nemate pravo da menjate ovaj čas');
    }

    Object.assign(classSession, updateClassSessionDto);
    return this.classSessionsRepository.save(classSession);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const classSession = await this.findOne(id);
    const subject = await this.subjectsRepository.findOne({
      where: { id: classSession.subjectId },
    });

    if (
      currentUser.role !== UserRole.ADMIN &&
      subject.teacherId !== currentUser.id
    ) {
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
    });

    if (
      currentUser.role !== UserRole.ADMIN &&
      subject.teacherId !== currentUser.id
    ) {
      throw new UnauthorizedException('Nemate pravo da aktivirate ovaj čas');
    }

    if (classSession.isActive) {
      throw new BadRequestException('Čas je već aktivan');
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
    });

    if (
      currentUser.role !== UserRole.ADMIN &&
      subject.teacherId !== currentUser.id
    ) {
      throw new UnauthorizedException('Nemate pravo da deaktivirate ovaj čas');
    }

    classSession.isActive = false;
    classSession.qrCodeToken = null;
    classSession.expiresAt = null;

    return this.classSessionsRepository.save(classSession);
  }
}
