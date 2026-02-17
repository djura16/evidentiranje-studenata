import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SubjectScheduleDto } from './subject-schedule.dto';

export enum SemesterType {
  WINTER = 'winter',
  SUMMER = 'summer',
}

export class CreateSubjectDto {
  @ApiProperty({ example: 'Matematika 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Osnovni kurs matematike', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, description: 'Obavezno za Admin-a - glavni profesor' })
  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @ApiProperty({ type: [String], required: false, description: 'Lista ID-eva profesora (Admin može dodeliti više)' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  teacherIds?: string[];

  /** Zimski (oktobar–januar) ili Letnji (februar–jun) semestar */
  @ApiProperty({ enum: SemesterType, required: false })
  @IsEnum(SemesterType)
  @IsOptional()
  semesterType?: SemesterType;

  /** Godina početka školske godine (npr. 2024 za 2024/2025) */
  @ApiProperty({ example: 2024, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2050)
  @IsOptional()
  academicYearStart?: number;

  @ApiProperty({ example: '2025-02-10', required: false })
  @IsDateString()
  @IsOptional()
  semesterStartDate?: string;

  @ApiProperty({ example: '2025-06-15', required: false })
  @IsDateString()
  @IsOptional()
  semesterEndDate?: string;

  @ApiProperty({
    type: [SubjectScheduleDto],
    required: false,
    example: [
      { dayOfWeek: 1, startTime: '14:00', durationMinutes: 90, repeatsWeekly: true },
      { dayOfWeek: 3, startTime: '14:00', durationMinutes: 90, repeatsWeekly: true },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectScheduleDto)
  @IsOptional()
  schedules?: SubjectScheduleDto[];
}
