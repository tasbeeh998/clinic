import { apiBaseUrl } from '../config/api';
import { getAccessToken } from '../config/auth-token';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'RECEPTIONIST';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'RECEPTIONIST';
}

class UsersService {
  private getAuthHeaders() {
    const token = getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getUsers(): Promise<AppUser[]> {
    const response = await fetch(`${apiBaseUrl}/users`, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  }

  async createUser(data: CreateUserDto): Promise<AppUser> {
    const response = await fetch(`${apiBaseUrl}/users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create user');
    }
    return response.json();
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<AppUser> {
    const response = await fetch(`${apiBaseUrl}/users/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isActive }),
    });
    if (!response.ok) throw new Error('Failed to update user status');
    return response.json();
  }
}

export const usersService = new UsersService();
