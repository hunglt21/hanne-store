import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Overview, RevenueSeries, TopCustomer, TopProduct } from '../types';

export function useOverview() {
  return useQuery({
    queryKey: ['overview'],
    queryFn: async () => (await api.get<Overview>('/stats/overview')).data,
  });
}

export function useRevenue(granularity: 'month' | 'quarter' | 'year', periods?: number) {
  return useQuery({
    queryKey: ['revenue', granularity, periods],
    queryFn: async () =>
      (await api.get<RevenueSeries>('/stats/revenue', { params: { granularity, periods } })).data,
  });
}

export function useTopProducts(limit = 5, days?: number) {
  return useQuery({
    queryKey: ['top-products', limit, days],
    queryFn: async () =>
      (await api.get<{ data: TopProduct[] }>('/stats/top-products', { params: { limit, days } })).data.data,
  });
}

export function useTopCustomers(limit = 5, days?: number) {
  return useQuery({
    queryKey: ['top-customers', limit, days],
    queryFn: async () =>
      (await api.get<{ data: TopCustomer[] }>('/stats/top-customers', { params: { limit, days } })).data.data,
  });
}
