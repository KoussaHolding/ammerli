import api from '@/lib/api-client';
import { User } from '@/types/api';

export interface LoginResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpires: number;
  user: User;
}

export const authService = {
  login: async (phone: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/phone/login', { phone, password });
    return response.data;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: async (data: any) => {
    const response = await api.post('/auth/phone/register', data);
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  logout: async () => {
    await api.post('/auth/logout');
  },
};
