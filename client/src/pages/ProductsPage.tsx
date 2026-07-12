import { useEffect, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import { useSnackbar } from 'notistack';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductFormDialog from './ProductFormDialog';
import { useAdjustStock, useCategories, useDeleteProduct, useProducts } from '../hooks/useProducts';
import { useDebounce } from '../hooks/useDebounce';
import { apiError, imageUrl } from '../lib/api';
import { formatVnd } from '../lib/format';
import type { Product } from '../types';

type ViewMode = 'table' | 'grid';
const VIEW_KEY = 'hanne_products_view';

function stockColor(q: number): 'success' | 'warning' | 'error' {
  if (q <= 0) return 'error';
  if (q <= 10) return 'warning';
  return 'success';
}

function Thumb({ product, size = 40 }: { product: Product; size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 1.5,
        bgcolor: '#f2f6f3',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {product.imageUrl ? (
        <img src={imageUrl(product.imageUrl)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Inventory2OutlinedIcon sx={{ fontSize: size * 0.5, color: 'text.disabled' }} />
      )}
    </Box>
  );
}

export default function ProductsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [view, setView] = useState<ViewMode>(() =>
    (typeof window !== 'undefined' && window.localStorage.getItem(VIEW_KEY)) === 'grid' ? 'grid' : 'table'
  );
  const debouncedQ = useDebounce(q, 300);

  const { data, isLoading } = useProducts({
    q: debouncedQ || undefined,
    category: category || undefined,
    sort,
    order: sort === 'name' ? 'asc' : 'desc',
  });
  const { data: categories } = useCategories();
  const adjustStock = useAdjustStock();
  const del = useDeleteProduct();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const changeView = (_: unknown, v: ViewMode | null) => {
    if (!v) return;
    setView(v);
    window.localStorage.setItem(VIEW_KEY, v);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setFormOpen(true);
  };

  const changeStock = async (p: Product, delta: number) => {
    if (p.quantity + delta < 0) return;
    try {
      await adjustStock.mutateAsync({ id: p.id, delta });
    } catch (err) {
      enqueueSnackbar(apiError(err), { variant: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      enqueueSnackbar('Đã xóa sản phẩm', { variant: 'success' });
      setDeleting(null);
    } catch (err) {
      enqueueSnackbar(apiError(err), { variant: 'error' });
    }
  };

  const products = data?.data ?? [];

  // Client-side pagination (shared by table + grid)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  useEffect(() => setPage(0), [debouncedQ, category, sort]);
  const pageCount = Math.max(1, Math.ceil(products.length / rowsPerPage));
  const safePage = Math.min(page, pageCount - 1);
  const paged = products.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage);

  const pagination =
    products.length > 0 ? (
      <TablePagination
        component="div"
        count={products.length}
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

  const SortHeader = ({
    field,
    children,
    align = 'left',
  }: {
    field: string;
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

  const StockStepper = ({ p }: { p: Product }) => (
    <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="flex-end">
      <IconButton size="small" onClick={() => changeStock(p, -1)} disabled={p.quantity <= 0}>
        <RemoveCircleOutlineIcon fontSize="small" />
      </IconButton>
      <Chip size="small" color={stockColor(p.quantity)} variant="outlined" label={p.quantity} sx={{ minWidth: 44 }} />
      <IconButton size="small" onClick={() => changeStock(p, 1)}>
        <AddCircleOutlineIcon fontSize="small" />
      </IconButton>
    </Stack>
  );

  const tableView = (
    <TableContainer component={Card} sx={{ overflowX: 'auto' }}>
      <Table sx={{ minWidth: 680 }}>
        <TableHead>
          <TableRow>
            <SortHeader field="name">Sản phẩm</SortHeader>
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>SKU</TableCell>
            <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
              Giá nhập
            </TableCell>
            <SortHeader field="salePrice" align="right">
              Giá bán
            </SortHeader>
            <SortHeader field="quantity" align="right">
              Tồn kho
            </SortHeader>
            <TableCell align="right">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paged.map((p) => {
            const finalPrice = Math.round(p.salePrice * (1 - p.promotionPercent / 100));
            const hasPromo = p.promotionPercent > 0;
            return (
              <TableRow key={p.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Thumb product={p} />
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                          {p.name}
                        </Typography>
                        {!p.isActive && <Chip size="small" label="Ngừng bán" sx={{ height: 18, fontSize: 11 }} />}
                      </Stack>
                      {p.category && (
                        <Typography variant="caption" color="text.secondary">
                          {p.category}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'text.secondary' }}>
                  {p.sku || '—'}
                </TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary' }}>
                  {formatVnd(p.importPrice)}
                </TableCell>
                <TableCell align="right">
                  <Stack alignItems="flex-end">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {hasPromo && <Chip size="small" color="secondary" label={`-${p.promotionPercent}%`} sx={{ height: 18, fontSize: 11 }} />}
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {formatVnd(finalPrice)}
                      </Typography>
                    </Stack>
                    {hasPromo && (
                      <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
                        {formatVnd(p.salePrice)}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <StockStepper p={p} />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" justifyContent="flex-end">
                    <Tooltip title="Sửa">
                      <IconButton size="small" onClick={() => openEdit(p)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton size="small" color="error" onClick={() => setDeleting(p)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const gridView = (
    <Grid container spacing={2}>
      {products.map((p) => {
        const finalPrice = Math.round(p.salePrice * (1 - p.promotionPercent / 100));
        const hasPromo = p.promotionPercent > 0;
        return (
          <Grid item xs={6} sm={4} md={3} key={p.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ position: 'relative', aspectRatio: '1 / 1', bgcolor: '#f2f6f3' }}>
                {p.imageUrl ? (
                  <img src={imageUrl(p.imageUrl)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Box sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                    <Inventory2OutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                  </Box>
                )}
                {hasPromo && (
                  <Chip size="small" color="secondary" label={`-${p.promotionPercent}%`} sx={{ position: 'absolute', top: 8, left: 8 }} />
                )}
                {!p.isActive && (
                  <Chip
                    size="small"
                    label="Ngừng bán"
                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff' }}
                  />
                )}
              </Box>

              <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {p.category && (
                  <Typography variant="caption" color="text.secondary">
                    {p.category}
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, lineHeight: 1.3, minHeight: 36, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {p.name}
                </Typography>

                <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ mt: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {formatVnd(finalPrice)}
                  </Typography>
                  {hasPromo && (
                    <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
                      {formatVnd(p.salePrice)}
                    </Typography>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Giá nhập: {formatVnd(p.importPrice)}
                </Typography>

                <Box sx={{ flex: 1 }} />

                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                  <StockStepper p={p} />
                  <Stack direction="row">
                    <Tooltip title="Sửa">
                      <IconButton size="small" onClick={() => openEdit(p)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton size="small" color="error" onClick={() => setDeleting(p)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  return (
    <Box>
      <PageHeader
        title="Sản phẩm"
        subtitle={data ? `${data.total} sản phẩm trong kho` : 'Quản lý kho hàng của bạn'}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Thêm sản phẩm
          </Button>
        }
      />

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }} alignItems={{ sm: 'center' }}>
        <TextField
          placeholder="Tìm theo tên, SKU..."
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
        <TextField select label="Danh mục" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">Tất cả</MenuItem>
          {(categories ?? []).map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField select label="Sắp xếp" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="createdAt">Mới nhất</MenuItem>
          <MenuItem value="name">Tên A-Z</MenuItem>
          <MenuItem value="quantity">Tồn kho</MenuItem>
          <MenuItem value="salePrice">Giá bán</MenuItem>
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
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={56} sx={{ mb: 1 }} />
            ))}
          </Card>
        ) : (
          <Grid container spacing={2}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}>
                <Skeleton variant="rounded" height={280} />
              </Grid>
            ))}
          </Grid>
        )
      ) : products.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inventory2OutlinedIcon fontSize="inherit" />}
            title="Chưa có sản phẩm"
            description="Thêm sản phẩm đầu tiên để bắt đầu quản lý kho hàng."
            action={
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                Thêm sản phẩm
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

      <ProductFormDialog open={formOpen} product={editing} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!deleting}
        title="Xóa sản phẩm"
        message={`Bạn có chắc muốn xóa "${deleting?.name}"? Hành động này không thể hoàn tác.`}
        danger
        confirmText="Xóa"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
