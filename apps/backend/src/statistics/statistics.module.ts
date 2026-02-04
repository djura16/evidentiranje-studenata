import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { User } from '../auth/entities/user.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { ClassSession } from '../classes/entities/class-session.entity';
import { Attendance } from '../attendance/entities/attendance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Subject, ClassSession, Attendance])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
