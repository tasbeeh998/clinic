import { apiBaseUrl } from '../config/api';

export interface ReportsSummary {
  totalRevenue: number;
  totalCollected: number;
  outstandingAmount: number;
  newPatients: number;
  totalAppointments: number;
  totalVisits: number;
  totalInvoices: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  collected: number;
}

export interface PaymentMethodRow {
  method: string;
  amount: number;
}

export interface InvoiceStatusRow {
  paymentStatus: string;
  count: number;
}

export interface ServiceUsageRow {
  serviceName: string;
  timesUsed: number;
  revenue: number;
}

export interface VisitTypeRow {
  type: string;
  count: number;
}

export interface AppointmentStatusRow {
  status: string;
  count: number;
}

export interface OutstandingInvoiceRow {
  id: string;
  invoiceNumber: string;
  remaining: string;
  patient: { fullNameAr: string };
}

export interface OutstandingInvoicesResponse {
  data: OutstandingInvoiceRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

class ReportsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(`${apiBaseUrl}/reports${path}${query}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Failed to fetch ${path}`);
    }
    return response.json();
  }

  getSummary(from: string, to: string) {
    return this.get<ReportsSummary>('/summary', { from, to });
  }

  getRevenueTimeseries(from: string, to: string) {
    return this.get<RevenuePoint[]>('/revenue-timeseries', { from, to });
  }

  getPaymentMethods(from: string, to: string) {
    return this.get<PaymentMethodRow[]>('/payment-methods', { from, to });
  }

  getInvoiceStatusBreakdown(from: string, to: string) {
    return this.get<InvoiceStatusRow[]>('/invoice-status', { from, to });
  }

  getServiceUsage(from: string, to: string) {
    return this.get<ServiceUsageRow[]>('/service-usage', { from, to });
  }

  getVisitTypes(from: string, to: string) {
    return this.get<VisitTypeRow[]>('/visit-types', { from, to });
  }

  getAppointmentStatus(from: string, to: string) {
    return this.get<AppointmentStatusRow[]>('/appointment-status', { from, to });
  }

  getOutstandingInvoices(page: number, limit: number) {
    return this.get<OutstandingInvoicesResponse>('/outstanding-invoices', {
      page: page.toString(),
      limit: limit.toString(),
    });
  }
}

export const reportsService = new ReportsService();
