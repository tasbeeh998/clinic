import { IsString, IsOptional, IsDateString, MaxLength, IsNotEmpty } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  civilId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullNameAr: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  fullNameEn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;
}
