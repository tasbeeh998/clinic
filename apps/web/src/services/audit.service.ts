import { apiBaseUrl } from '../config/api';
import { getAccessToken } from '../config/auth-token';

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  user?: { name: string } | null;
}

export interface AuditLogsResponse {
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

  async getLogs(page: number, limit: number): Promise<AuditLogsResponse> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    const response = await fetch(`${apiBaseUrl}/audit?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
  }
}

export const auditService = new AuditService();
