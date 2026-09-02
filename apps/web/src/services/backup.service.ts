import { apiBaseUrl } from '../config/api';

export interface BackupEntry {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  triggeredBy: 'manual' | 'scheduled' | 'pre-restore-safety';
  uploadedToRemote: boolean;
}

export interface BackupStatus {
  lastBackup: BackupEntry | null;
  totalBackups: number;
  totalSizeBytes: number;
  retentionDays: number;
  remoteStorageConfigured: boolean;
}

class BackupService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getStatus(): Promise<BackupStatus> {
    const response = await fetch(`${apiBaseUrl}/backup/status`, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch backup status');
    return response.json();
  }

  async listBackups(): Promise<BackupEntry[]> {
    const response = await fetch(`${apiBaseUrl}/backup/list`, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch backups list');
    return response.json();
  }

  async runBackup(): Promise<BackupEntry> {
    const response = await fetch(`${apiBaseUrl}/backup/run`, { method: 'POST', headers: this.getAuthHeaders() });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create backup');
    }
    return response.json();
  }

  async restoreBackup(filename: string): Promise<{ restored: string; restoredAt: string }> {
    const response = await fetch(`${apiBaseUrl}/backup/restore`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ filename, confirm: true }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to restore backup');
    }
    return response.json();
  }
}

export const backupService = new BackupService();
