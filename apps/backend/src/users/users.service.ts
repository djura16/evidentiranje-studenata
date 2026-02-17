import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '@evidentiranje/shared';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException('Email već postoji');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async findAll(currentUser: User): Promise<User[]> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Samo admin može pristupiti svim korisnicima');
    }
    return this.usersRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'indexNumber', 'enrollmentYear', 'role', 'avatar', 'createdAt'],
    });
  }

  async findOne(id: string, currentUser: User): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'indexNumber', 'enrollmentYear', 'role', 'avatar', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('Korisnik nije pronađen');
    }

    // Users can only view their own profile unless they're admin
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new UnauthorizedException('Nemate pravo da vidite ovog korisnika');
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: User,
  ): Promise<User> {
    const user = await this.findOne(id, currentUser);

    // Only admin can change roles
    if (updateUserDto.role && currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Samo admin može menjati uloge');
    }

    const { password, ...rest } = updateUserDto;
    Object.assign(user, rest);

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(password, salt);
    }

    return this.usersRepository.save(user);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Samo admin može brisati korisnike');
    }

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Korisnik nije pronađen');
    }

    await this.usersRepository.remove(user);
  }

  async getStatistics(currentUser: User) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Samo admin može pristupiti statistici');
    }

    const [totalUsers, totalTeachers, totalStudents] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { role: UserRole.TEACHER } }),
      this.usersRepository.count({ where: { role: UserRole.STUDENT } }),
    ]);

    return {
      totalUsers,
      totalTeachers,
      totalStudents,
      totalAdmins: await this.usersRepository.count({
        where: { role: UserRole.ADMIN },
      }),
    };
  }
}
