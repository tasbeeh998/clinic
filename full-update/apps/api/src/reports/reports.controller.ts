import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// Financial data end-to-end, so Admin-only — same access level as invoices.
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getSummary(from, to);
  }

  @Get('revenue-timeseries')
  getRevenueTimeseries(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getRevenueTimeseries(from, to);
  }

  @Get('payment-methods')
  getPaymentMethodBreakdown(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getPaymentMethodBreakdown(from, to);
  }

  @Get('invoice-status')
  getInvoiceStatusBreakdown(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getInvoiceStatusBreakdown(from, to);
  }

  @Get('service-usage')
  getServiceUsage(@Query('from') from?: string, @Query('to') to?: string, @Query('limit') limit?: string) {
    return this.reportsService.getServiceUsage(from, to, limit ? parseInt(limit, 10) : 10);
  }

  @Get('visit-types')
  getVisitTypeBreakdown(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getVisitTypeBreakdown(from, to);
  }

  @Get('appointment-status')
  getAppointmentStatusBreakdown(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getAppointmentStatusBreakdown(from, to);
  }

  @Get('new-patients-timeseries')
  getNewPatientsTimeseries(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getNewPatientsTimeseries(from, to);
  }

  @Get('outstanding-invoices')
  getOutstandingInvoices(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.reportsService.getOutstandingInvoices(page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
  }
}
