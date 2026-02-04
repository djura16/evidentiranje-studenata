import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { ActivateClassDto } from './dto/activate-class.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @ApiOperation({ summary: 'Kreiranje novog časa' })
  create(@Body() createClassSessionDto: CreateClassSessionDto, @GetUser() user: User) {
    return this.classesService.create(createClassSessionDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Pregled svih časova' })
  findAll(@GetUser() user: User, @Query('subjectId') subjectId?: string) {
    return this.classesService.findAll(user, subjectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Pregled časa po ID' })
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje časa' })
  update(
    @Param('id') id: string,
    @Body() updateClassSessionDto: UpdateClassSessionDto,
    @GetUser() user: User,
  ) {
    return this.classesService.update(id, updateClassSessionDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje časa' })
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.classesService.remove(id, user);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Aktiviranje časa i generisanje QR koda' })
  activateClass(
    @Param('id') id: string,
    @Body() activateDto: ActivateClassDto,
    @GetUser() user: User,
  ) {
    return this.classesService.activateClass(id, user, activateDto.expirationMinutes);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deaktiviranje časa' })
  deactivateClass(@Param('id') id: string, @GetUser() user: User) {
    return this.classesService.deactivateClass(id, user);
  }
}
