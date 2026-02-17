import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRole } from '@evidentiranje/shared';

export class CreateUserDto {
  @ApiProperty({ example: 'student@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(32)
  password: string;

  @ApiProperty({ example: 'Marko' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Marković' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: '001', required: false, description: 'Broj indeksa (samo broj)' })
  @ValidateIf((o) => o.indexNumber != null && o.indexNumber !== '')
  @IsString()
  @Matches(/^\d+$/, {
    message: 'Broj indeksa mora sadržati samo cifre (npr. 001)',
  })
  @IsOptional()
  indexNumber?: string;

  @ApiProperty({ example: 2024, required: false, description: 'Godina upisa' })
  @ValidateIf((o) => o.enrollmentYear != null)
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2050)
  @IsOptional()
  enrollmentYear?: number;

  @ApiProperty({ enum: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  avatar?: string;
}
