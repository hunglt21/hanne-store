import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import StarIcon from '@mui/icons-material/Star';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CustomerFormDialog from './CustomerFormDialog';
import EmptyState from '../components/EmptyState';
import { useCustomer } from '../hooks/useCustomers';
import { formatVnd, formatDateTime, formatNumber } from '../lib/format';

function PeriodCard({ label, spent, orders }: { label: string; spent: number; orders: number }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
          {formatVnd(spent)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatNumber(orders)} đơn hàng
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useCustomer(Number(id));
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rounded" height={140} sx={{ my: 2 }} />
        <Grid container spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Không tìm thấy khách hàng"
        action={
          <Button component={RouterLink} to="/customers" variant="contained">
            Về danh sách
          </Button>
        }
      />
    );
  }

  const { customer, stats, invoices } = data;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')} sx={{ mb: 2 }} color="inherit">
        Khách hàng
      </Button>

      {/* Profile */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Avatar sx={{ bgcolor: customer.isVip ? 'secondary.main' : 'primary.main', width: 64, height: 64, fontSize: 28 }}>
              {customer.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {customer.name}
                </Typography>
                {customer.isVip && <Chip size="small" color="secondary" icon={<StarIcon />} label="VIP" />}
              </Stack>
              <Stack direction="row" spacing={2} sx={{ mt: 0.5, flexWrap: 'wrap' }} color="text.secondary">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PhoneOutlinedIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{customer.phone || '—'}</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PlaceOutlinedIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{customer.address || '—'}</Typography>
                </Stack>
              </Stack>
              {customer.note && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                  “{customer.note}”
                </Typography>
              )}
            </Box>
            <IconButton onClick={() => setEditOpen(true)} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <EditOutlinedIcon />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      {/* Lifetime + period stats */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ height: '100%', bgcolor: 'primary.main', color: '#fff' }}>
            <CardContent>
              <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600 }}>
                Tổng chi tiêu
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>
                {formatVnd(stats.totalSpent)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {formatNumber(stats.orderCount)} đơn · gần nhất{' '}
                {stats.lastOrderAt ? formatDateTime(stats.lastOrderAt) : '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <PeriodCard label="Tháng này" spent={stats.month.spent} orders={stats.month.orders} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <PeriodCard label="Quý này" spent={stats.quarter.spent} orders={stats.quarter.orders} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <PeriodCard label="Năm nay" spent={stats.year.spent} orders={stats.year.orders} />
        </Grid>
      </Grid>

      {/* Invoice history */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Lịch sử hóa đơn
          </Typography>
          {invoices.length === 0 ? (
            <EmptyState
              icon={<ReceiptLongOutlinedIcon fontSize="inherit" />}
              title="Chưa có hóa đơn"
              description="Khách hàng này chưa có giao dịch nào."
            />
          ) : (
            <List disablePadding>
              {invoices.map((inv, i) => (
                <Box key={inv.id}>
                  <ListItemButton component={RouterLink} to={`/invoices/${inv.id}`} sx={{ borderRadius: 2, px: 1 }}>
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {inv.code}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {formatVnd(inv.total)}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(inv.createdAt)} · {inv._count?.items ?? inv.items?.length ?? 0} sản phẩm
                        </Typography>
                      }
                    />
                  </ListItemButton>
                  {i < invoices.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <CustomerFormDialog open={editOpen} customer={customer} onClose={() => setEditOpen(false)} />
    </Box>
  );
}
