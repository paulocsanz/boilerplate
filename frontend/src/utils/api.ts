import type { User, CreateUserRequest, UpdateUserRequest, DeleteResponse } from '../types/api';

// Get the API base URL based on environment
function getApiBaseUrl(): string {
  console.log('Environment check:', {
    DEV: import.meta.env.DEV,
    VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD
  });
  
  // In development, use localhost
  if (import.meta.env.DEV) {
    console.log('Using localhost for development');
    return 'http://localhost:3001';
  }
  
  // In production, use VITE_BACKEND_URL if available, otherwise relative path
  if (import.meta.env.VITE_BACKEND_URL) {
    console.log('Using VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // Fallback to relative path (same domain)
  console.log('Using relative path fallback');
  return '';
}

export const API_BASE_URL = getApiBaseUrl();
console.log('Final API_BASE_URL:', API_BASE_URL);

// Create a simpler API client using fetch with type safety
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    console.log(this.baseUrl, endpoint);
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Create type-safe API client instance
const apiClient = new ApiClient(API_BASE_URL);

// Type-safe API methods
export const api = {
  users: {
    getAll: (): Promise<User[]> => apiClient.get<User[]>('/api/users'),
    getById: (id: string): Promise<User> => apiClient.get<User>(`/api/users/${id}`),
    create: (data: CreateUserRequest): Promise<User> => apiClient.post<User>('/api/users', data),
    update: (id: string, data: UpdateUserRequest): Promise<User> => apiClient.put<User>(`/api/users/${id}`, data),
    delete: (id: string): Promise<DeleteResponse> => apiClient.delete<DeleteResponse>(`/api/users/${id}`),
  },
};

// Legacy helper function for backwards compatibility (if needed)
export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
