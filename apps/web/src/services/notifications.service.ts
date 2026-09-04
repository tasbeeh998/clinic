import { apiBaseUrl } from '../config/api';

export interface AppNotification {
  id: string;
  type: 'BACKUP_DUE' | 'APPOINTMENT_UPCOMING';
  title: string;
  message: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}

class NotificationsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getAll(): Promise<AppNotification[]> {
    const response = await fetch(`${apiBaseUrl}/notifications`, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  }

  async getUnreadCount(): Promise<number> {
    const response = await fetch(`${apiBaseUrl}/notifications/unread-count`, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch unread count');
    return response.json();
  }

  async markRead(id: string): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
  }

  async markAllRead(): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/notifications/read-all`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark all as read');
  }
}

export const notificationsService = new NotificationsService();
