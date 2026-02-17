import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
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

  @Post('admin/subject/:subjectId/student/:studentId')
  @ApiOperation({ summary: 'Admin upisuje studenta na predmet' })
  adminEnroll(
    @Param('subjectId') subjectId: string,
    @Param('studentId') studentId: string,
    @GetUser() user: User,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Samo admin može upisivati studente');
    }
    return this.enrollmentsService.enroll(studentId, subjectId);
  }

  @Delete('admin/subject/:subjectId/student/:studentId')
  @ApiOperation({ summary: 'Admin ispisuje studenta sa predmeta' })
  adminUnenroll(
    @Param('subjectId') subjectId: string,
    @Param('studentId') studentId: string,
    @GetUser() user: User,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Samo admin može ispisivati studente');
    }
    return this.enrollmentsService.unenroll(studentId, subjectId);
  }

  @Post('admin/subject/:subjectId/bulk-by-year')
  @ApiOperation({ summary: 'Admin masovno upisuje studente po godini upisa' })
  bulkEnrollByYear(
    @Param('subjectId') subjectId: string,
    @Body() body: { enrollmentYear: number },
    @GetUser() user: User,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Samo admin može masovno upisivati');
    }
    return this.enrollmentsService.bulkEnrollByYear(subjectId, body.enrollmentYear);
  }

  @Post('admin/subject/:subjectId/bulk-unenroll-by-year')
  @ApiOperation({ summary: 'Admin masovno ispisuje studente po godini upisa' })
  bulkUnenrollByYear(
    @Param('subjectId') subjectId: string,
    @Body() body: { enrollmentYear: number },
    @GetUser() user: User,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Samo admin može masovno ispisivati');
    }
    return this.enrollmentsService.bulkUnenrollByYear(subjectId, body.enrollmentYear);
  }

  @Get('my')
  @ApiOperation({ summary: 'Moji upisani predmeti (studenti, samo pregled)' })
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
}
