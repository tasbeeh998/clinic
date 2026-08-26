import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe, Request, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  create(@Request() req, @Body() createPaymentDto: CreatePaymentDto) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.paymentsService.create(createPaymentDto, req.user.id, ipAddress, userAgent);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  findAllForInvoice(@Query('invoiceId') invoiceId?: string) {
    if (!invoiceId) {
      throw new BadRequestException('invoiceId query parameter is required');
    }
    return this.paymentsService.findAllForInvoice(invoiceId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.paymentsService.remove(id, req.user.id, req.user.role, ipAddress, userAgent);
  }
}
