import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Customer, CustomerStats, CustomerWithStats, Invoice, Paged } from '../types';

export interface CustomerQuery {
  q?: string;
  sort?: 'name' | 'createdAt' | 'totalSpent' | 'orderCount';
  order?: 'asc' | 'desc';
}

export function useCustomers(params: CustomerQuery) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => (await api.get<Paged<CustomerWithStats>>('/customers', { params })).data,
  });
}

export interface CustomerDetail {
  customer: Customer;
  stats: CustomerStats;
  invoices: (Invoice & { _count?: { items: number } })[];
}

export function useCustomer(id: number | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['customer', id],
    queryFn: async () => (await api.get<CustomerDetail>(`/customers/${id}`)).data,
  });
}

export function useSaveCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<Customer> & { id?: number }) => {
      if (c.id) return (await api.put(`/customers/${c.id}`, c)).data;
      return (await api.post('/customers', c)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/customers/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}
