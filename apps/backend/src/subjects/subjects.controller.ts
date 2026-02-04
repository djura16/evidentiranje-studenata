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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('subjects')
@ApiBearerAuth()
@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Kreiranje novog predmeta' })
  create(@Body() createSubjectDto: CreateSubjectDto, @GetUser() user: User) {
    return this.subjectsService.create(createSubjectDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Pregled svih predmeta' })
  findAll(@GetUser() user: User) {
    return this.subjectsService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Pregled predmeta po ID' })
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ažuriranje predmeta' })
  update(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
    @GetUser() user: User,
  ) {
    return this.subjectsService.update(id, updateSubjectDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Brisanje predmeta' })
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.subjectsService.remove(id, user);
  }
}
