import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  async login(@Req() req, @Res({ passthrough: true }) res: Response, @Body() loginDto: LoginDto) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const rememberMe = loginDto.rememberMe || false;
    
    const result = await this.authService.login(loginDto, ipAddress, userAgent, rememberMe);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 30 days or 7 days
    };

    res.cookie('refreshToken', result.refreshToken, cookieOptions);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async register(@Req() req, @Body() registerDto: RegisterDto) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.register(registerDto, ipAddress, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const result = await this.authService.refreshTokens(refreshToken, ipAddress, userAgent);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie('refreshToken', result.refreshToken, cookieOptions);

    return { 
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const refreshToken = req.cookies?.refreshToken;

    await this.authService.logout(refreshToken, req.user.id, ipAddress, userAgent);

    res.clearCookie('refreshToken');

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Request() req) {
    return req.user;
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
      ipAddress,
      userAgent,
    );
  }
}
