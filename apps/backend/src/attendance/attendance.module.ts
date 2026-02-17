import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceGateway } from './attendance.gateway';
import { Attendance } from './entities/attendance.entity';
import { ClassSession } from '../classes/entities/class-session.entity';
import { User } from '../auth/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Subject } from '../subjects/entities/subject.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, ClassSession, User, Enrollment, Subject]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceGateway],
  exports: [AttendanceService],
})
export class AttendanceModule {}
