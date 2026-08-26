import { IsString, IsUUID, IsDateString, IsOptional, IsNotEmpty, IsEnum, MaxLength } from 'class-validator';
import { VisitType } from '@prisma/client';

export class CreateVisitDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsEnum(VisitType)
  @IsNotEmpty()
  type: VisitType;

  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @IsDateString()
  @IsOptional()
  visitDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  diagnosis?: string;
}
