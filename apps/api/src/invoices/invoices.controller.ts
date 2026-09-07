import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ParseUUIDPipe, Request, Res, HttpCode } from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { InvoicePdfService } from './pdf/invoice-pdf.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { AddChargeDto } from './dto/add-charge.dto';
import { CreateReplacementDto } from './dto/create-replacement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, InvoiceStatus } from '@prisma/client';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly invoicePdfService: InvoicePdfService,
  ) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  create(@Request() req, @Body() createInvoiceDto: CreateInvoiceDto) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.invoicesService.create(createInvoiceDto, req.user.id, ipAddress, userAgent);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  findAll(
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.invoicesService.findAll(
      patientId,
      status as InvoiceStatus,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findOne(id);
  }

  // Locale comes from the query string because the backend has no notion of
  // the frontend's active react-i18next language on its own — whatever
  // triggers this (download button, WhatsApp share) must pass ?lang=ar|en.
  @Get(':id/pdf')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('lang') lang: string | undefined,
    @Res() res: Response,
  ) {
    const locale = lang === 'en' ? 'en' : 'ar';
    const invoice = await this.invoicesService.findOne(id);
    const pdfBuffer = await this.invoicePdfService.generatePdf(id, locale);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  updateStatus(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateInvoiceStatusDto,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.invoicesService.updateStatus(id, updateStatusDto, req.user.id, req.user.role, ipAddress, userAgent);
  }

  @Post(':id/charges')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @HttpCode(201)
  addCharge(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addChargeDto: AddChargeDto,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.invoicesService.addCharge(id, addChargeDto, req.user.id, req.user.role, ipAddress, userAgent);
  }

  @Post(':id/replacement')
  @Roles(UserRole.ADMIN)
  createReplacement(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createReplacementDto: CreateReplacementDto,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.invoicesService.createReplacement(id, createReplacementDto, req.user.id, req.user.role, ipAddress, userAgent);
  }
}
