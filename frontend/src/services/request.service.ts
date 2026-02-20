import api from '@/lib/api-client';
import { Request, RequestType } from '@/types/api';

export const requestService = {
  create: async (data: {
    pickupLat: number;
    pickupLng: number;
    quantity: number;
    type: RequestType;
    productId?: string;
  }): Promise<Request> => {
    const response = await api.post('/requests', data);
    return response.data;
  },
  getActive: async (): Promise<Request | null> => {
    // This depends on backend implementation, usually a search endpoint
    const response = await api.get('/requests/active');
    return response.data;
  },
  cancel: async (id: string): Promise<void> => {
    await api.post(`/requests/${id}/cancel`);
  },
};
