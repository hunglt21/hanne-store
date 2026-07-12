import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Pagination,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { useInvoices, type InvoiceQuery } from '../hooks/useInvoices';
import { useDebounce } from '../hooks/useDebounce';
import { formatVnd, formatDateTime } from '../lib/format';

const STATUS: Record<string, { label: string; color: 'success' | 'warning' | 'default' }> = {
  confirmed: { label: 'Đã xác nhận', color: 'success' },
  draft: { label: 'Nháp', color: 'warning' },
  cancelled: { label: 'Đã hủy', color: 'default' },
};

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<InvoiceQuery['sort']>('createdAt');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q, 300);
  const pageSize = 15;

  const { data, isLoading } = useInvoices({
    q: debouncedQ || undefined,
    from: from || undefined,
    to: to ? `${to}T23:59:59` : undefined,
    sort,
    order: 'desc',
    page,
    pageSize,
  });

  const invoices = data?.data ?? [];
  const pageCount = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <Box>
      <PageHeader
        title="Hóa đơn"
        subtitle={data ? `${data.total} hóa đơn` : 'Danh sách hóa đơn bán hàng'}
        action={
          <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/invoices/new">
            Tạo hóa đơn
          </Button>
        }
      />

      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={5}>
          <TextField
            placeholder="Tìm mã đơn, tên khách..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={6} sm={2.5}>
          <TextField
            label="Từ ngày"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={6} sm={2.5}>
          <TextField
            label="Đến ngày"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField
            select
            label="Sắp xếp"
            value={sort}
            onChange={(e) => setSort(e.target.value as InvoiceQuery['sort'])}
            fullWidth
          >
            <MenuItem value="createdAt">Mới nhất</MenuItem>
            <MenuItem value="total">Giá trị cao</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Card>
        {isLoading ? (
          <Box sx={{ p: 2 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<ReceiptLongOutlinedIcon fontSize="inherit" />}
            title="Chưa có hóa đơn"
            description="Tạo hóa đơn đầu tiên để gửi cho khách hàng."
            action={
              <Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/invoices/new">
                Tạo hóa đơn
              </Button>
            }
          />
        ) : (
          <Box>
            {invoices.map((inv, i) => {
              const st = STATUS[inv.status] ?? STATUS.confirmed;
              return (
                <Box key={inv.id}>
                  <Box
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#f7faf8' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: 'rgba(46,139,87,0.10)',
                        color: 'primary.main',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ReceiptLongOutlinedIcon fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {inv.code}
                        </Typography>
                        <Chip label={st.label} color={st.color} size="small" variant="outlined" sx={{ height: 20 }} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {inv.customerName} · {formatDateTime(inv.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {formatVnd(inv.total)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {inv._count?.items ?? 0} sp
                      </Typography>
                    </Box>
                    <ChevronRightIcon sx={{ color: 'text.disabled' }} />
                  </Box>
                  {i < invoices.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Box>
        )}
      </Card>

      {pageCount > 1 && (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Stack>
      )}
    </Box>
  );
}
