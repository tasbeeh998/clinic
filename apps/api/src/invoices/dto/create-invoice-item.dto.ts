import { IsUUID, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceItemDto {
  @IsUUID()
  serviceId: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(1)
  quantity?: number = 1;
}
