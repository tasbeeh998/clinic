import { apiBaseUrl } from '../config/api';
import { getAccessToken } from '../config/auth-token';

export interface ReportsSummary {
  range: { from: string; to: string };
  totalRevenue: number;
  totalCollected: number;
  outstandingAmount: number;
  totalInvoices: number;
  totalVisits: number;
  newPatients: number;
  totalAppointments: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  collected: number;
}

export interface PaymentMethodRow {
  method: 'CASH' | 'VISA' | 'KNET' | 'OTHER';
  amount: number;
  count: number;
}

export interface InvoiceStatusRow {
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  amount: number;
  count: number;
}

export interface ServiceUsageRow {
  serviceName: string;
  timesUsed: number;
  revenue: number;
}

export interface VisitTypeRow {
  type: 'CHECKUP' | 'FOLLOW_UP' | 'OTHER';
  count: number;
}

export interface AppointmentStatusRow {
  status: string;
  count: number;
}

export interface NewPatientsPoint {
  date: string;
  count: number;
}

export interface OutstandingInvoiceRow {
  id: string;
  invoiceNumber: string;
  total: string;
  paid: string;
  remaining: string;
  paymentStatus: string;
  issuedAt: string | null;
  patient: { fullNameAr: string; civilId: string };
}

class ReportsService {
  private getAuthHeaders() {
    const token = getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${apiBaseUrl}${path}`, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch report data');
    return response.json();
  }

  private rangeQuery(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }

  getSummary(from?: string, to?: string) {
    return this.get<ReportsSummary>(`/reports/summary${this.rangeQuery(from, to)}`);
  }

  getRevenueTimeseries(from?: string, to?: string) {
    return this.get<RevenuePoint[]>(`/reports/revenue-timeseries${this.rangeQuery(from, to)}`);
  }

  getPaymentMethods(from?: string, to?: string) {
    return this.get<PaymentMethodRow[]>(`/reports/payment-methods${this.rangeQuery(from, to)}`);
  }

  getInvoiceStatusBreakdown(from?: string, to?: string) {
    return this.get<InvoiceStatusRow[]>(`/reports/invoice-status${this.rangeQuery(from, to)}`);
  }

  getServiceUsage(from?: string, to?: string) {
    return this.get<ServiceUsageRow[]>(`/reports/service-usage${this.rangeQuery(from, to)}`);
  }

  getVisitTypes(from?: string, to?: string) {
    return this.get<VisitTypeRow[]>(`/reports/visit-types${this.rangeQuery(from, to)}`);
  }

  getAppointmentStatus(from?: string, to?: string) {
    return this.get<AppointmentStatusRow[]>(`/reports/appointment-status${this.rangeQuery(from, to)}`);
  }

  getNewPatientsTimeseries(from?: string, to?: string) {
    return this.get<NewPatientsPoint[]>(`/reports/new-patients-timeseries${this.rangeQuery(from, to)}`);
  }

  async getOutstandingInvoices(page: number = 1, limit: number = 10) {
    return this.get<{ data: OutstandingInvoiceRow[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/reports/outstanding-invoices?page=${page}&limit=${limit}`,
    );
  }
}

export const reportsService = new ReportsService();
