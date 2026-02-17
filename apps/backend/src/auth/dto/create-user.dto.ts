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
import { Type } from 'class-transformer';
import { UserRole } from '@evidentiranje/shared';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(32)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ValidateIf((o) => o.indexNumber != null && o.indexNumber !== '')
  @IsString()
  @Matches(/^\d+(\/\d{4})?$/, {
    message: 'Broj indeksa mora biti u formatu broj ili broj/godina (npr. 001 ili 001/2024)',
  })
  @IsOptional()
  indexNumber?: string;

  @ValidateIf((o) => o.enrollmentYear != null)
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2050)
  @IsOptional()
  enrollmentYear?: number;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  avatar?: string;
}
