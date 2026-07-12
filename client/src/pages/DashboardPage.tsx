import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import RevenueChart from '../components/RevenueChart';
import { useOverview, useRevenue, useTopCustomers, useTopProducts } from '../hooks/useStats';
import { useProducts } from '../hooks/useProducts';
import { useInvoices } from '../hooks/useInvoices';
import { formatVnd, formatDateTime, formatNumber } from '../lib/format';
import { useAuth } from '../auth/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: overview, isLoading } = useOverview();
  const { data: revenue } = useRevenue('month', 6);
  const { data: topProducts } = useTopProducts(5);
  const { data: topCustomers } = useTopCustomers(5);
  const { data: lowStock } = useProducts({ lowStock: true, sort: 'quantity', order: 'asc' });
  const { data: recent } = useInvoices({ pageSize: 6, sort: 'createdAt', order: 'desc' });

  return (
    <Box>
      <PageHeader
        title={`Xin chào, ${user?.name || 'bạn'} 👋`}
        subtitle="Tổng quan hoạt động kinh doanh của cửa hàng"
        action={
          <Button component={RouterLink} to="/invoices/new" variant="contained">
            + Tạo hóa đơn
          </Button>
        }
      />

      {/* KPI cards */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          {isLoading ? (
            <Skeleton variant="rounded" height={92} />
          ) : (
            <StatCard
              label="Doanh thu tháng này"
              value={formatVnd(overview?.revenue.month)}
              icon={<PaidOutlinedIcon />}
              color="#2e8b57"
              hint={`Hôm nay: ${formatVnd(overview?.revenue.today)}`}
            />
          )}
        </Grid>
        <Grid item xs={6} md={3}>
          {isLoading ? (
            <Skeleton variant="rounded" height={92} />
          ) : (
            <StatCard
              label="Lợi nhuận tháng này"
              value={formatVnd(overview?.profit.month)}
              icon={<TrendingUpOutlinedIcon />}
              color="#d6607f"
              hint={`Cả năm: ${formatVnd(overview?.profit.year)}`}
            />
          )}
        </Grid>
        <Grid item xs={6} md={3}>
          {isLoading ? (
            <Skeleton variant="rounded" height={92} />
          ) : (
            <StatCard
              label="Đơn tháng này"
              value={formatNumber(overview?.orders.month)}
              icon={<ReceiptLongOutlinedIcon />}
              color="#3f7cac"
              hint={`Tổng đơn: ${formatNumber(overview?.invoices.count)}`}
            />
          )}
        </Grid>
        <Grid item xs={6} md={3}>
          {isLoading ? (
            <Skeleton variant="rounded" height={92} />
          ) : (
            <StatCard
              label="Sản phẩm sắp hết"
              value={formatNumber(overview?.products.lowStockCount)}
              icon={<WarningAmberOutlinedIcon />}
              color="#e8940c"
              hint={`Tồn kho: ${formatNumber(overview?.products.totalUnits)} sp`}
            />
          )}
        </Grid>
      </Grid>

      {/* Revenue chart + low stock */}
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Doanh thu & lợi nhuận 6 tháng gần đây
              </Typography>
              {revenue ? (
                <RevenueChart data={revenue.data} />
              ) : (
                <Skeleton variant="rounded" height={300} />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Cảnh báo tồn kho
                </Typography>
                <Chip size="small" color="warning" label={`≤ ${overview?.lowStockThreshold ?? 10}`} />
              </Stack>
              {!lowStock ? (
                <Skeleton variant="rounded" height={200} />
              ) : lowStock.data.length === 0 ? (
                <Alert severity="success" variant="outlined" sx={{ borderRadius: 2 }}>
                  Tất cả sản phẩm đều còn đủ hàng.
                </Alert>
              ) : (
                <List dense disablePadding>
                  {lowStock.data.slice(0, 6).map((p) => (
                    <ListItemButton key={p.id} component={RouterLink} to="/products" sx={{ borderRadius: 2, px: 1 }}>
                      <Inventory2OutlinedIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                      <ListItemText primary={p.name} primaryTypographyProps={{ noWrap: true, fontSize: 14 }} />
                      <Chip
                        size="small"
                        label={`Còn ${p.quantity}`}
                        color={p.quantity === 0 ? 'error' : 'warning'}
                        variant="outlined"
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top products / customers / recent */}
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Sản phẩm bán chạy
              </Typography>
              <List dense disablePadding>
                {(topProducts ?? []).map((p, i) => (
                  <Box key={`${p.productId}-${i}`}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                      <Box sx={{ fontWeight: 800, color: 'primary.main', width: 20 }}>{i + 1}</Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                          {p.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Đã bán {formatNumber(p.quantity)}
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
                    Chưa có dữ liệu bán hàng.
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Khách hàng thân thiết
              </Typography>
              <List dense disablePadding>
                {(topCustomers ?? []).map((c, i) => (
                  <Box key={`${c.customerId}-${i}`}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                      <Box sx={{ fontWeight: 800, color: 'secondary.main', width: 20 }}>{i + 1}</Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
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
                    Chưa có dữ liệu khách hàng.
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Hóa đơn gần đây
                </Typography>
                <Button size="small" component={RouterLink} to="/invoices" endIcon={<ArrowForwardIcon />}>
                  Tất cả
                </Button>
              </Stack>
              <List dense disablePadding>
                {(recent?.data ?? []).map((inv) => (
                  <ListItemButton
                    key={inv.id}
                    component={RouterLink}
                    to={`/invoices/${inv.id}`}
                    sx={{ borderRadius: 2, px: 1 }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {inv.customerName}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {formatVnd(inv.total)}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {inv.code} · {formatDateTime(inv.createdAt)}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))}
                {recent && recent.data.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Chưa có hóa đơn nào.
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
