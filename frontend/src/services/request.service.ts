import api from '@/lib/api-client';
import { Request, RequestStatus } from '@/types/api';

export const requestService = {
  create: async (data: {
    pickupLat: number;
    pickupLng: number;
    quantity: number;
    type: 'IMMEDIATE' | 'SCHEDULED';
  }): Promise<Request> => {
    const response = await api.post('/request', data);
    return response.data;
  },
  getActive: async (): Promise<Request | null> => {
    // This depends on backend implementation, usually a search endpoint
    const response = await api.get('/request/active');
    return response.data;
  },
  cancel: async (id: string): Promise<void> => {
    await api.post(`/request/${id}/cancel`);
  },
};
