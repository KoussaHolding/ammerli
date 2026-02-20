import api from '@/lib/api-client';

export interface DriverLocation {
  id: string;
  position: [number, number];
}

export const driverService = {
  getNearby: async (lat: number, lng: number, radius = 5): Promise<DriverLocation[]> => {
    const response = await api.get('/drivers/nearby', {
      params: { lat, lng, radius },
    });
    return response.data;
  },
};
