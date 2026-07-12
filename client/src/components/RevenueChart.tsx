import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Box } from '@mui/material';
import type { RevenueBucket } from '../types';
import { formatVnd, formatVndShort } from '../lib/format';

export default function RevenueChart({ data, height = 300 }: { data: RevenueBucket[]; height?: number }) {
  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5b6b62' }} tickLine={false} axisLine={{ stroke: '#e6ede8' }} />
          <YAxis
            tickFormatter={(v) => formatVndShort(v)}
            tick={{ fontSize: 12, fill: '#5b6b62' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            formatter={(value: number, name) => [formatVnd(value), name]}
            contentStyle={{ borderRadius: 12, border: '1px solid #e6ede8', fontSize: 13 }}
            labelStyle={{ fontWeight: 700, color: '#1f2a24' }}
          />
          <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
          <Bar dataKey="revenue" name="Doanh thu" fill="#2e8b57" radius={[6, 6, 0, 0]} maxBarSize={44} />
          <Line dataKey="profit" name="Lợi nhuận" stroke="#d6607f" strokeWidth={2.5} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}
