import { IsInt, IsString, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SubjectScheduleDto {
  @ApiProperty({ example: 1, description: '1=Ponedeljak, 7=Nedelja' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty({ example: '14:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: 90 })
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  repeatsWeekly?: boolean;
}
