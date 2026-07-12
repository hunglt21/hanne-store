import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import StarIcon from '@mui/icons-material/Star';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import CustomerFormDialog from './CustomerFormDialog';
import { useCustomers, useDeleteCustomer, type CustomerQuery } from '../hooks/useCustomers';
import { useDebounce } from '../hooks/useDebounce';
import { apiError } from '../lib/api';
import { formatVnd, formatNumber } from '../lib/format';
import type { CustomerWithStats } from '../types';

type ViewMode = 'table' | 'grid';
const VIEW_KEY = 'hanne_customers_view';

export default function CustomersPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<CustomerQuery['sort']>('totalSpent');
  const [view, setView] = useState<ViewMode>(() =>
    (typeof window !== 'undefined' && window.localStorage.getItem(VIEW_KEY)) === 'grid' ? 'grid' : 'table'
  );
  const debouncedQ = useDebounce(q, 300);

  const { data, isLoading } = useCustomers({
    q: debouncedQ || undefined,
    sort,
    order: sort === 'name' ? 'asc' : 'desc',
  });
  const del = useDeleteCustomer();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerWithStats | null>(null);
  const [deleting, setDeleting] = useState<CustomerWithStats | null>(null);

  const changeView = (_: unknown, v: ViewMode | null) => {
    if (!v) return;
    setView(v);
    window.localStorage.setItem(VIEW_KEY, v);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      enqueueSnackbar('Đã xóa khách hàng', { variant: 'success' });
      setDeleting(null);
    } catch (err) {
      enqueueSnackbar(apiError(err), { variant: 'error' });
    }
  };

  const customers = data?.data ?? [];

  // Client-side pagination (shared by table + grid)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  useEffect(() => setPage(0), [debouncedQ, sort]);
  const pageCount = Math.max(1, Math.ceil(customers.length / rowsPerPage));
  const safePage = Math.min(page, pageCount - 1);
  const paged = customers.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage);

  const pagination =
    customers.length > 0 ? (
      <TablePagination
        component="div"
        count={customers.length}
        page={safePage}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[12, 24, 48]}
        labelRowsPerPage="Số dòng:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
        sx={{ mt: 1 }}
      />
    ) : null;

  // Clickable, sort-aware table header cell (shares the same `sort` state as the dropdown).
  const SortHeader = ({
    field,
    children,
    align = 'left',
  }: {
    field: NonNullable<CustomerQuery['sort']>;
    children: ReactNode;
    align?: 'left' | 'right';
  }) => (
    <TableCell align={align} sortDirection={sort === field ? (field === 'name' ? 'asc' : 'desc') : false}>
      <TableSortLabel
        active={sort === field}
        direction={sort === field ? (field === 'name' ? 'asc' : 'desc') : 'asc'}
        onClick={() => setSort(field)}
      >
        {children}
      </TableSortLabel>
    </TableCell>
  );

  const tableView = (
    <TableContainer component={Card} sx={{ overflowX: 'auto' }}>
      <Table sx={{ minWidth: 520 }}>
        <TableHead>
          <TableRow>
            <SortHeader field="name">Khách hàng</SortHeader>
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Số điện thoại</TableCell>
            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Địa chỉ</TableCell>
            <SortHeader field="orderCount" align="right">
              Số đơn
            </SortHeader>
            <SortHeader field="totalSpent" align="right">
              Đã chi
            </SortHeader>
            <TableCell align="right">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paged.map((c) => (
            <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/customers/${c.id}`)}>
              <TableCell>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: c.isVip ? 'secondary.main' : 'primary.main', width: 36, height: 36, fontSize: 16 }}>
                    {c.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                        {c.name}
                      </Typography>
                      {c.isVip && <StarIcon sx={{ fontSize: 15, color: 'secondary.main' }} />}
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: { md: 'none' } }}
                      noWrap
                    >
                      {c.phone || 'Chưa có SĐT'}
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{c.phone || '—'}</TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, maxWidth: 240 }}>
                <Typography variant="body2" noWrap>
                  {c.address || '—'}
                </Typography>
              </TableCell>
              <TableCell align="right">{formatNumber(c.orderCount)}</TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {formatVnd(c.totalSpent)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" justifyContent="flex-end">
                  <Tooltip title="Sửa">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(c);
                        setFormOpen(true);
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleting(c);
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const gridView = (
    <Grid container spacing={2}>
      {customers.map((c) => (
        <Grid item xs={12} sm={6} md={4} key={c.id}>
          <Card sx={{ height: '100%', position: 'relative' }}>
            <CardActionArea onClick={() => navigate(`/customers/${c.id}`)} sx={{ p: 2, height: '100%' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Avatar sx={{ bgcolor: c.isVip ? 'secondary.main' : 'primary.main', width: 44, height: 44 }}>
                  {c.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                      {c.name}
                    </Typography>
                    {c.isVip && <StarIcon sx={{ fontSize: 16, color: 'secondary.main' }} />}
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                    <PhoneOutlinedIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption" noWrap>
                      {c.phone || 'Chưa có SĐT'}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Box sx={{ flex: 1, bgcolor: '#f2f6f3', borderRadius: 2, px: 1.5, py: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Đã chi
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {formatVnd(c.totalSpent)}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, bgcolor: '#f2f6f3', borderRadius: 2, px: 1.5, py: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Số đơn
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {formatNumber(c.orderCount)}
                  </Typography>
                </Box>
              </Stack>
            </CardActionArea>

            <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, right: 8 }}>
              <Tooltip title="Sửa">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(c);
                    setFormOpen(true);
                  }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Xóa">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleting(c);
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box>
      <PageHeader
        title="Khách hàng"
        subtitle={data ? `${data.total} khách hàng` : 'Kho thông tin khách hàng'}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Thêm khách hàng
          </Button>
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }} alignItems={{ sm: 'center' }}>
        <TextField
          placeholder="Tìm theo tên, số điện thoại..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          label="Sắp xếp"
          value={sort}
          onChange={(e) => setSort(e.target.value as CustomerQuery['sort'])}
          sx={{ minWidth: 190 }}
        >
          <MenuItem value="totalSpent">Doanh thu cao nhất</MenuItem>
          <MenuItem value="orderCount">Nhiều đơn nhất</MenuItem>
          <MenuItem value="name">Tên A-Z</MenuItem>
          <MenuItem value="createdAt">Mới nhất</MenuItem>
        </TextField>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={changeView}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' }, bgcolor: '#fff' }}
        >
          <ToggleButton value="table" aria-label="Dạng bảng">
            <Tooltip title="Dạng bảng">
              <ViewListOutlinedIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="grid" aria-label="Dạng lưới">
            <Tooltip title="Dạng lưới">
              <GridViewOutlinedIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {isLoading ? (
        view === 'table' ? (
          <Card sx={{ p: 2 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={52} sx={{ mb: 1 }} />
            ))}
          </Card>
        ) : (
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rounded" height={120} />
              </Grid>
            ))}
          </Grid>
        )
      ) : customers.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PeopleAltOutlinedIcon fontSize="inherit" />}
            title="Chưa có khách hàng"
            description="Thêm khách hàng để theo dõi lịch sử mua và doanh số."
            action={
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                Thêm khách hàng
              </Button>
            }
          />
        </Card>
      ) : view === 'table' ? (
        tableView
      ) : (
        gridView
      )}

      {!isLoading && pagination}

      <CustomerFormDialog open={formOpen} customer={editing} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!deleting}
        title="Xóa khách hàng"
        message={`Xóa khách hàng "${deleting?.name}"? Các hóa đơn cũ vẫn được giữ lại.`}
        danger
        confirmText="Xóa"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
