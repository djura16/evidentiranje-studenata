import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('scan')
  @ApiOperation({ summary: 'Skeniranje QR koda za evidenciju prisustva' })
  scanQrCode(@Query('token') token: string, @GetUser() user: User) {
    return this.attendanceService.scanQrCode(token, user);
  }

  @Get('my')
  @ApiOperation({ summary: 'Pregled sopstvenog prisustva (studenti)' })
  getMyAttendance(@GetUser() user: User) {
    return this.attendanceService.getMyAttendance(user);
  }

  @Get('class/:classSessionId')
  @ApiOperation({ summary: 'Pregled prisustva za određeni čas' })
  getClassAttendance(
    @Param('classSessionId') classSessionId: string,
    @GetUser() user: User,
  ) {
    return this.attendanceService.getClassAttendance(classSessionId, user);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Pregled prisustva određenog studenta' })
  getStudentAttendance(
    @Param('studentId') studentId: string,
    @GetUser() user: User,
  ) {
    return this.attendanceService.getStudentAttendance(studentId, user);
  }

  @Get('statistics/:subjectId')
  @ApiOperation({ summary: 'Statistika prisustva za predmet' })
  getAttendanceStatistics(
    @Param('subjectId') subjectId: string,
    @GetUser() user: User,
  ) {
    return this.attendanceService.getAttendanceStatistics(subjectId, user);
  }
}
