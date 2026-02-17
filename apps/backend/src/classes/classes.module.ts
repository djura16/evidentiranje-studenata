import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { ClassSession } from './entities/class-session.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { SubjectTeacher } from '../subjects/entities/subject-teacher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassSession, Subject, SubjectTeacher])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
