import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassSessionDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '2024-01-15T11:30:00Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;
}
