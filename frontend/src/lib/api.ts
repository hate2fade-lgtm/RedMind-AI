import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  User,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  Analysis,
  AnalysisCreate,
  AnalysisListResponse,
  UserStats,
  APIError,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - добавляем токен
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - обработка ошибок
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<APIError>) => {
        if (error.response?.status === 401) {
          // Токен истёк - разлогиниваем
          this.removeToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', token);
  }

  private removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
  }

  // ==================== AUTH ====================

  async register(credentials: RegisterCredentials): Promise<User> {
    const { data } = await this.client.post<User>('/auth/register', credentials);
    return data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const { data } = await this.client.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    this.setToken(data.access_token);
    return data;
  }

  async logout(): Promise<void> {
    this.removeToken();
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<User>('/auth/me');
    return data;
  }

  // ==================== ANALYSIS ====================

  async createAnalysis(analysisData: AnalysisCreate): Promise<Analysis> {
    const { data } = await this.client.post<Analysis>('/analyze/', analysisData);
    return data;
  }

  async getAnalysis(id: number): Promise<Analysis> {
    const { data } = await this.client.get<Analysis>(`/analyze/${id}`);
    return data;
  }

  async getAnalyses(skip: number = 0, limit: number = 20): Promise<AnalysisListResponse> {
    const { data } = await this.client.get<AnalysisListResponse>('/analyze/', {
      params: { skip, limit },
    });
    return data;
  }

  async deleteAnalysis(id: number): Promise<void> {
    await this.client.delete(`/analyze/${id}`);
  }

  // ==================== USER ====================

  async getUserStats(): Promise<UserStats> {
    const { data } = await this.client.get<UserStats>('/users/me/stats');
    return data;
  }

  async deleteAccount(): Promise<void> {
    await this.client.delete('/users/me');
    this.removeToken();
  }

  // ==================== HELPERS ====================

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getApiUrl(): string {
    return API_URL;
  }
}

// Singleton instance
const api = new ApiClient();

export default api;

// Export error handler
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as APIError;
    return apiError?.detail || error.message || 'Произошла ошибка';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Неизвестная ошибка';
}