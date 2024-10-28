import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './models/jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
  ) {}

  async create(createAuthDto: CreateUserDto) {
    const { username } = createAuthDto;
    const user = await this.authRepository.findOneBy({ username });

    if (user) {
      throw new ConflictException('Korisničko ime već postoji');
    }

    return this.authRepository.createUser(createAuthDto);
  }

  async login(loginUserDto: LoginUserDto) {
    const { username, password } = loginUserDto;

    const user = await this.authRepository.findOneBy({ username });

    if (user && bcrypt.compare(password, user.password)) {
      const payload: JwtPayload = { username };
      const accessToken = await this.jwtService.signAsync(payload);
      return { accessToken };
    } else {
      throw new UnauthorizedException('Neispravno korisničko ime ili lozinka');
    }
  }

  async findAll(user: User) {
    if (user.type !== 0) {
      throw new UnauthorizedException(
        'Nedovoljna prava za pristup ovoj informaciji',
      );
    }
    const users = await this.authRepository.find({
      select: ['firstName', 'lastName', 'username'],
      where: { type: 1 },
    });
    return users;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateUserDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
