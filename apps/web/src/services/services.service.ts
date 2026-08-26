import { apiBaseUrl } from '../config/api';

export interface Service {
  id: string;
  name: string;
  code?: string;
  description?: string;
  currentPrice: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface CreateServiceDto {
  name: string;
  code?: string;
  description?: string;
  currentPrice: number;
  isActive?: boolean;
}

export interface UpdateServiceDto {
  name?: string;
  code?: string;
  description?: string;
  currentPrice?: number;
  isActive?: boolean;
}

export interface UpdateStatusDto {
  isActive: boolean;
}

export interface ServicesListResponse {
  data: Service[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class ServicesService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getServices(
    search?: string,
    isActive?: boolean,
    page: number = 1,
    limit: number = 20
  ): Promise<ServicesListResponse> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (isActive !== undefined) params.append('isActive', isActive.toString());
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await fetch(
      `${apiBaseUrl}/services?${params.toString()}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch services');
    }

    return response.json();
  }

  async getService(id: string): Promise<Service> {
    const response = await fetch(`${apiBaseUrl}/services/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service');
    }

    return response.json();
  }

  async createService(data: CreateServiceDto): Promise<Service> {
    const response = await fetch(`${apiBaseUrl}/services`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create service');
    }

    return response.json();
  }

  async updateService(id: string, data: UpdateServiceDto): Promise<Service> {
    const response = await fetch(`${apiBaseUrl}/services/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update service');
    }

    return response.json();
  }

  async updateServiceStatus(id: string, data: UpdateStatusDto): Promise<Service> {
    const response = await fetch(`${apiBaseUrl}/services/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update service status');
    }

    return response.json();
  }

  async getActiveServices(page: number = 1, limit: number = 100): Promise<ServicesListResponse> {
    return this.getServices(undefined, true, page, limit);
  }
}

export const servicesService = new ServicesService();
