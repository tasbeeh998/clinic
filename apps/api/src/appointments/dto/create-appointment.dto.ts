import { IsString, IsUUID, IsDateString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
