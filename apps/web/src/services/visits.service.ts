import { apiBaseUrl } from '../config/api';

export interface Visit {
  id: string;
  patientId: string;
  appointmentId?: string;
  type: 'CHECKUP' | 'FOLLOW_UP' | 'OTHER';
  visitDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  patient: {
    id: string;
    civilId: string;
    fullNameAr: string;
    phone?: string;
  };
  appointment?: {
    id: string;
    scheduledAt: string;
    status: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface CreateVisitDto {
  patientId: string;
  type: 'CHECKUP' | 'FOLLOW_UP' | 'OTHER';
  appointmentId?: string;
  visitDate?: string;
  notes?: string;
  diagnosis?: string;
}

export interface UpdateVisitDto {
  type?: 'CHECKUP' | 'FOLLOW_UP' | 'OTHER';
  appointmentId?: string;
  visitDate?: string;
  notes?: string;
  diagnosis?: string;
}

export interface VisitsListResponse {
  data: Visit[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class VisitsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getVisits(
    patientId?: string,
    appointmentId?: string,
    type?: string,
    from?: string,
    to?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<VisitsListResponse> {
    const params = new URLSearchParams();
    if (patientId) params.append('patientId', patientId);
    if (appointmentId) params.append('appointmentId', appointmentId);
    if (type) params.append('type', type);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await fetch(
      `${apiBaseUrl}/visits?${params.toString()}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch visits');
    }

    return response.json();
  }

  async getVisit(id: string): Promise<Visit> {
    const response = await fetch(`${apiBaseUrl}/visits/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch visit');
    }

    return response.json();
  }

  async createVisit(data: CreateVisitDto): Promise<Visit> {
    const response = await fetch(`${apiBaseUrl}/visits`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create visit');
    }

    return response.json();
  }

  async updateVisit(id: string, data: UpdateVisitDto): Promise<Visit> {
    const response = await fetch(`${apiBaseUrl}/visits/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update visit');
    }

    return response.json();
  }

  async getPatientVisits(patientId: string, page: number = 1, limit: number = 20): Promise<VisitsListResponse> {
    return this.getVisits(patientId, undefined, undefined, undefined, undefined, page, limit);
  }
}

export const visitsService = new VisitsService();
