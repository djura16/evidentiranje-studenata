import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '@evidentiranje/shared';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Kreiranje novog korisnika (samo admin)' })
  @ApiResponse({ status: 201, description: 'Korisnik kreiran' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Pregled svih korisnika (samo admin)' })
  findAll(@GetUser() user: User) {
    return this.usersService.findAll(user);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Statistika korisnika (samo admin)' })
  getStatistics(@GetUser() user: User) {
    return this.usersService.getStatistics(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Pregled korisnika po ID' })
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.usersService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje korisnika' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: User,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Brisanje korisnika (samo admin)' })
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.usersService.remove(id, user);
  }
}
