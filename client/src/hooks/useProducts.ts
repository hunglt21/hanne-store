import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Paged, Product } from '../types';

export interface ProductQuery {
  q?: string;
  category?: string;
  sort?: string;
  order?: string;
  lowStock?: boolean;
}

export function useProducts(params: ProductQuery) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => (await api.get<Paged<Product>>('/products', { params })).data,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<string[]>('/products/categories')).data,
  });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<Product> & { id?: number }) => {
      if (p.id) return (await api.put(`/products/${p.id}`, p)).data;
      return (await api.post('/products', p)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/products/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
    },
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: number; delta?: number; quantity?: number }) =>
      (await api.patch(`/products/${input.id}/stock`, { delta: input.delta, quantity: input.quantity })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
    },
  });
}
