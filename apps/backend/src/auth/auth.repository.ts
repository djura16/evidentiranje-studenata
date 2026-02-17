import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from '@evidentiranje/shared';

@Injectable()
export class AuthRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, firstName, lastName, indexNumber, enrollmentYear: dtoYear, role } = createUserDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Parse "001/2024" into indexNumber and enrollmentYear (if enrollmentYear not provided)
    let enrollmentYear: number | undefined = dtoYear;
    let finalIndexNumber = indexNumber;
    if (indexNumber && indexNumber.includes('/') && enrollmentYear == null) {
      const [num, year] = indexNumber.split('/');
      finalIndexNumber = num;
      enrollmentYear = year ? parseInt(year, 10) : undefined;
    }

    const user = this.create({
      email,
      firstName,
      lastName,
      indexNumber: finalIndexNumber,
      enrollmentYear,
      password: hashedPassword,
      role: role || UserRole.STUDENT,
    });
    try {
      return await this.save(user);
    } catch (error) {
      // duplicate email
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException('Email već postoji');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
