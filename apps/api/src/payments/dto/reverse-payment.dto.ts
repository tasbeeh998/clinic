import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ReversePaymentDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reversalNotes?: string;
}
