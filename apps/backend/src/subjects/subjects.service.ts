import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '@evidentiranje/shared';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto, currentUser: User): Promise<Subject> {
    if (currentUser.role !== UserRole.TEACHER && currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Samo profesor može kreirati predmet');
    }

    const subject = this.subjectsRepository.create({
      ...createSubjectDto,
      teacherId: currentUser.role === UserRole.ADMIN 
        ? createSubjectDto.teacherId || currentUser.id 
        : currentUser.id,
    });

    return this.subjectsRepository.save(subject);
  }

  async findAll(currentUser: User): Promise<Subject[]> {
    if (currentUser.role === UserRole.TEACHER) {
      return this.subjectsRepository.find({
        where: { teacherId: currentUser.id },
        relations: ['teacher'],
      });
    }
    // Admin and students can see all subjects
    return this.subjectsRepository.find({
      relations: ['teacher'],
    });
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.subjectsRepository.findOne({
      where: { id },
      relations: ['teacher', 'classSessions'],
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

    if (
      currentUser.role !== UserRole.ADMIN &&
      subject.teacherId !== currentUser.id
    ) {
      throw new UnauthorizedException('Nemate pravo da menjate ovaj predmet');
    }

    Object.assign(subject, updateSubjectDto);
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
