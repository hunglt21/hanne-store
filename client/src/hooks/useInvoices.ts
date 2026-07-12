import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Invoice, Paged } from '../types';

export interface InvoiceQuery {
  q?: string;
  from?: string;
  to?: string;
  sort?: 'createdAt' | 'total';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export function useInvoices(params: InvoiceQuery) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => (await api.get<Paged<Invoice>>('/invoices', { params })).data,
  });
}

export function useInvoice(id: number | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['invoice', id],
    queryFn: async () => (await api.get<Invoice>(`/invoices/${id}`)).data,
  });
}

export interface CreateInvoiceItem {
  productId: number | null;
  name: string;
  quantity: number;
  unitPrice: number;
  importPrice?: number;
}

export interface CreateInvoiceInput {
  customerId?: number | null;
  customerName: string;
  customerPhone?: string | null;
  items: CreateInvoiceItem[];
  discount: number;
  amountPaid?: number;
  note?: string | null;
  status?: 'confirmed' | 'draft';
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => (await api.post<Invoice>('/invoices', input)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['revenue'] });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/invoices/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
    },
  });
}
