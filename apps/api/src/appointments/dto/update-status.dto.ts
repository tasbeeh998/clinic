import { IsEnum, IsNotEmpty } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(AppointmentStatus)
  @IsNotEmpty()
  status: AppointmentStatus;
}
