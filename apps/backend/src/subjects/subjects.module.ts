import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { Subject } from './entities/subject.entity';
import { SubjectSchedule } from './entities/subject-schedule.entity';
import { SubjectTeacher } from './entities/subject-teacher.entity';
import { User } from '../auth/entities/user.entity';
import { ClassSession } from '../classes/entities/class-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subject, SubjectSchedule, SubjectTeacher, User, ClassSession]),
  ],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
