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
    // Note: The auth context now manages accessToken in memory
    // This service method is kept for compatibility but should be updated
    // to get the token from the auth context instead of localStorage
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  setAccessToken(token: string) {
    // Method to set token from auth context
    // This is a temporary fix - service should get token from context
    localStorage.setItem('accessToken', token);
  }

  clearAccessToken() {
    localStorage.removeItem('accessToken');
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
    // This method is deprecated - use reversePayment instead
    const response = await fetch(`${apiBaseUrl}/payments/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove payment');
    }
  }

  async reversePayment(id: string, reversalNotes?: string): Promise<{ id: string; reversed: boolean }> {
    const response = await fetch(`${apiBaseUrl}/payments/${id}/reverse`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reversalNotes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reverse payment');
    }

    return response.json();
  }
}

export const paymentsService = new PaymentsService();
