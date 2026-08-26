import { IsEnum, IsNotEmpty } from 'class-validator';
import { InvoiceStatus } from '@prisma/client';

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoiceStatus)
  @IsNotEmpty()
  status: InvoiceStatus;
}
