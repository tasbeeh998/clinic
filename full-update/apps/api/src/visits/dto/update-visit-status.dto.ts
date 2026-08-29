import { IsEnum, IsNotEmpty } from 'class-validator';
import { VisitStatus } from '@prisma/client';

export class UpdateVisitStatusDto {
  @IsEnum(VisitStatus)
  @IsNotEmpty()
  status: VisitStatus;
}
