import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async createUser(createUserDto: CreateUserDto): Promise<void> {
    const { username, password, firstName, lastName } = createUserDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.create({
      username,
      firstName,
      lastName,
      password: hashedPassword,
      type: 1,
    });
    try {
      await this.save(user);
    } catch (error) {
      // duplicate email
      if (error.code === '23505') {
        throw new ConflictException(error.message);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
