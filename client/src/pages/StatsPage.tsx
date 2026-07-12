import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import RevenueChart from '../components/RevenueChart';
import { useOverview, useRevenue, useTopCustomers, useTopProducts } from '../hooks/useStats';
import { formatVnd, formatNumber } from '../lib/format';

type Granularity = 'month' | 'quarter' | 'year';
const PERIODS: Record<Granularity, number> = { month: 12, quarter: 8, year: 5 };

export default function StatsPage() {
  const [granularity, setGranularity] = useState<Granularity>('month');
  const { data: revenue, isLoading } = useRevenue(granularity, PERIODS[granularity]);
  const { data: overview } = useOverview();
  const { data: topProducts } = useTopProducts(8);
  const { data: topCustomers } = useTopCustomers(8);

  const totals = revenue?.totals;
  const margin = totals && totals.revenue > 0 ? Math.round((totals.profit / totals.revenue) * 100) : 0;

  return (
    <Box>
      <PageHeader title="Thống kê doanh số" subtitle="Doanh thu, chi phí và lợi nhuận theo thời gian" />

      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={granularity}
          onChange={(_, v) => v && setGranularity(v)}
          color="primary"
        >
          <ToggleButton value="month">Tháng</ToggleButton>
          <ToggleButton value="quarter">Quý</ToggleButton>
          <ToggleButton value="year">Năm</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Summary */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <StatCard label="Tổng doanh thu" value={formatVnd(totals?.revenue)} icon={<PaidOutlinedIcon />} color="#2e8b57" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Tổng vốn hàng" value={formatVnd(totals?.cost)} icon={<ShoppingBagOutlinedIcon />} color="#3f7cac" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Lợi nhuận"
            value={formatVnd(totals?.profit)}
            icon={<TrendingUpOutlinedIcon />}
            color="#d6607f"
            hint={`Biên LN ${margin}%`}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Giá trị tồn kho"
            value={formatVnd(overview?.products.inventoryCostValue)}
            icon={<SavingsOutlinedIcon />}
            color="#e8940c"
            hint={`Bán ra ~ ${formatVnd(overview?.products.inventoryRetailValue)}`}
          />
        </Grid>
      </Grid>

      {/* Chart */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Biểu đồ doanh thu & lợi nhuận
          </Typography>
          {isLoading || !revenue ? <Skeleton variant="rounded" height={320} /> : <RevenueChart data={revenue.data} height={320} />}
        </CardContent>
      </Card>

      {/* Breakdown table */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Chi tiết theo kỳ
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Kỳ</TableCell>
                  <TableCell align="right">Doanh thu</TableCell>
                  <TableCell align="right">Vốn</TableCell>
                  <TableCell align="right">Lợi nhuận</TableCell>
                  <TableCell align="right">Biên LN</TableCell>
                  <TableCell align="right">Số đơn</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(revenue?.data ?? []).map((b) => {
                  const m = b.revenue > 0 ? Math.round((b.profit / b.revenue) * 100) : 0;
                  return (
                    <TableRow key={b.key} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{b.label}</TableCell>
                      <TableCell align="right">{formatVnd(b.revenue)}</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>
                        {formatVnd(b.cost)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: b.profit >= 0 ? 'primary.main' : 'error.main' }}>
                        {formatVnd(b.profit)}
                      </TableCell>
                      <TableCell align="right">{m}%</TableCell>
                      <TableCell align="right">{formatNumber(b.orders)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Top lists */}
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Sản phẩm bán chạy nhất
              </Typography>
              {(topProducts ?? []).map((p, i) => (
                <Box key={`${p.productId}-${i}`}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                    <Box sx={{ width: 22, fontWeight: 800, color: 'primary.main' }}>{i + 1}</Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {p.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Đã bán {formatNumber(p.quantity)} · LN {formatVnd(p.profit)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatVnd(p.revenue)}
                    </Typography>
                  </Stack>
                  {i < (topProducts?.length ?? 0) - 1 && <Divider />}
                </Box>
              ))}
              {topProducts && topProducts.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Chưa có dữ liệu.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Khách hàng chi tiêu nhiều nhất
              </Typography>
              {(topCustomers ?? []).map((c, i) => (
                <Box key={`${c.customerId}-${i}`}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                    <Box sx={{ width: 22, fontWeight: 800, color: 'secondary.main' }}>{i + 1}</Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {c.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatNumber(c.orderCount)} đơn
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatVnd(c.totalSpent)}
                    </Typography>
                  </Stack>
                  {i < (topCustomers?.length ?? 0) - 1 && <Divider />}
                </Box>
              ))}
              {topCustomers && topCustomers.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Chưa có dữ liệu.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
