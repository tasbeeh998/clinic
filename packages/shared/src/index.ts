// Shared types and utilities will be added here
// This package is a placeholder for future shared DTOs, interfaces, and constants

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
