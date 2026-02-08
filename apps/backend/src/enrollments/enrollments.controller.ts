import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '@evidentiranje/shared';

@ApiTags('enrollments')
@ApiBearerAuth()
@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('subject/:subjectId')
  @ApiOperation({ summary: 'Upis studenta na predmet' })
  enroll(@Param('subjectId') subjectId: string, @GetUser() user: User) {
    if (user.role !== UserRole.STUDENT) {
      throw new UnauthorizedException('Samo studenti se mogu upisivati na predmete');
    }
    return this.enrollmentsService.enroll(user.id, subjectId);
  }

  @Delete('subject/:subjectId')
  @ApiOperation({ summary: 'Odpis studenta sa predmeta' })
  unenroll(@Param('subjectId') subjectId: string, @GetUser() user: User) {
    if (user.role !== UserRole.STUDENT) {
      throw new UnauthorizedException('Samo studenti se mogu odpisivati sa predmeta');
    }
    return this.enrollmentsService.unenroll(user.id, subjectId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Moji upisani predmeti (studenti)' })
  getMyEnrollments(@GetUser() user: User) {
    if (user.role !== UserRole.STUDENT) {
      throw new UnauthorizedException('Samo studenti mogu videti svoje upise');
    }
    return this.enrollmentsService.getStudentEnrollments(user.id);
  }

  @Get('subject/:subjectId')
  @ApiOperation({ summary: 'Upisani studenti na predmet (profesor/admin)' })
  getSubjectEnrollments(
    @Param('subjectId') subjectId: string,
    @GetUser() user: User,
  ) {
    return this.enrollmentsService.getSubjectEnrollments(subjectId, user);
  }

  @Get('available-subjects')
  @ApiOperation({ summary: 'Svi dostupni predmeti za upis' })
  getAvailableSubjects() {
    return this.enrollmentsService.getAllAvailableSubjects();
  }
}
