import { apiBaseUrl } from '../config/api';

export type PaymentMethod = 'CASH' | 'VISA' | 'KNET' | 'OTHER';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: string;
  method: PaymentMethod;
  paymentDate: string;
  notes?: string;
  createdAt: string;
  recordedBy?: {
    id: string;
    name: string;
  };
}

export interface CreatePaymentDto {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
}

class PaymentsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getPaymentsForInvoice(invoiceId: string): Promise<Payment[]> {
    const response = await fetch(`${apiBaseUrl}/payments?invoiceId=${invoiceId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }

    return response.json();
  }

  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    const response = await fetch(`${apiBaseUrl}/payments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to record payment');
    }

    return response.json();
  }

  async deletePayment(id: string): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/payments/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove payment');
    }
  }
}

export const paymentsService = new PaymentsService();
