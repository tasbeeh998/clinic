import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserRole } from '@prisma/client';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
