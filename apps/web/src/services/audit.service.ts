import { apiBaseUrl } from '../config/api';
import { getAccessToken } from '../config/auth-token';

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  user: { id: string; name: string; role: string };
}

export interface AuditLogResponse {
  data: AuditLogEntry[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

class AuditService {
  private getAuthHeaders() {
    const token = getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getLogs(page: number = 1, limit: number = 20): Promise<AuditLogResponse> {
    const response = await fetch(`${apiBaseUrl}/audit-logs?page=${page}&limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
  }
}

export const auditService = new AuditService();
