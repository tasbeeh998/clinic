import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
