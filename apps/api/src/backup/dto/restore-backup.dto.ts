import { IsString, IsNotEmpty, IsBoolean, Equals } from 'class-validator';

export class RestoreBackupDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  // Must be explicitly true — a plain boolean rather than a route param
  // makes it much harder to trigger a restore by accident (e.g. from a
  // pre-filled form or a replayed request).
  @IsBoolean()
  @Equals(true, { message: 'confirm must be true to restore a backup' })
  confirm: boolean;
}
