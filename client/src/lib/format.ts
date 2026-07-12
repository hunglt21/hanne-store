/** Max VND value the backend accepts (Postgres 32-bit integer safe cap). */
export const MAX_MONEY = 2_000_000_000;

const vnd = new Intl.NumberFormat('vi-VN');

/** 1010500 -> "1.010.500 đ" */
export const formatVnd = (n: number | null | undefined) => `${vnd.format(Math.round(n || 0))} đ`;

/** 1010500 -> "1.010.500" (no currency symbol, for tables/inputs) */
export const formatNumber = (n: number | null | undefined) => vnd.format(Math.round(n || 0));

/** Compact money for tight spaces: 1500000 -> "1,5 tr" */
export function formatVndShort(n: number | null | undefined): string {
  const v = Math.round(n || 0);
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')} tr`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1000)}k`;
  return vnd.format(v);
}

export const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatDateTime = (d: string | Date) =>
  new Date(d).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Parse a user-typed money string ("1.010.500" or "1010500") into a number. */
export function parseNumber(s: string): number {
  const digits = (s || '').replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}
