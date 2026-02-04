import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActivateClassDto {
  @ApiPropertyOptional({
    description: 'Trajanje QR koda u minutama (1-60)',
    example: 5,
    minimum: 1,
    maximum: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  expirationMinutes?: number;
}
