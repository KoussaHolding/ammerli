import api from '@/lib/api-client';
import { Product } from '@/types/api';

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/product');
    return response.data;
  },
  getOne: async (id: string): Promise<Product> => {
    const response = await api.get(`/product/${id}`);
    return response.data;
  },
};
