import { useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useSnackbar } from 'notistack';
import MoneyField from '../components/MoneyField';
import { useCategories, useSaveProduct } from '../hooks/useProducts';
import { api, apiError, imageUrl } from '../lib/api';
import type { Product } from '../types';

interface FormState {
  name: string;
  sku: string;
  category: string;
  description: string;
  imageUrl: string;
  quantity: number;
  importPrice: number;
  salePrice: number;
  promotionPercent: number;
  isActive: boolean;
}

const EMPTY: FormState = {
  name: '',
  sku: '',
  category: '',
  description: '',
  imageUrl: '',
  quantity: 0,
  importPrice: 0,
  salePrice: 0,
  promotionPercent: 0,
  isActive: true,
};

export default function ProductFormDialog({
  open,
  product,
  onClose,
}: {
  open: boolean;
  product?: Product | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const { data: categories } = useCategories();
  const save = useSaveProduct();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      product
        ? {
            name: product.name,
            sku: product.sku ?? '',
            category: product.category ?? '',
            description: product.description ?? '',
            imageUrl: product.imageUrl ?? '',
            quantity: product.quantity,
            importPrice: product.importPrice,
            salePrice: product.salePrice,
            promotionPercent: product.promotionPercent,
            isActive: product.isActive,
          }
        : EMPTY
    );
  }, [open, product]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    setUploading(true);
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('imageUrl', r.data.url);
    } catch (err) {
      enqueueSnackbar(apiError(err), { variant: 'error' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onSubmit = async () => {
    if (!form.name.trim()) {
      enqueueSnackbar('Vui lòng nhập tên sản phẩm', { variant: 'warning' });
      return;
    }
    try {
      await save.mutateAsync({ ...form, id: product?.id });
      enqueueSnackbar(product ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm', { variant: 'success' });
      onClose();
    } catch (err) {
      enqueueSnackbar(apiError(err), { variant: 'error' });
    }
  };

  const finalPrice = Math.round(form.salePrice * (1 - form.promotionPercent / 100));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle sx={{ fontWeight: 700 }}>{product ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Image */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 88,
                height: 88,
                borderRadius: 2,
                bgcolor: '#f2f6f3',
                border: '1px dashed #cdddd2',
                overflow: 'hidden',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              {form.imageUrl ? (
                <img src={imageUrl(form.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <PhotoCameraOutlinedIcon sx={{ color: 'text.disabled' }} />
              )}
            </Box>
            <Stack spacing={1}>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
              <Button
                variant="outlined"
                size="small"
                startIcon={<PhotoCameraOutlinedIcon />}
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Đang tải...' : 'Chọn ảnh'}
              </Button>
              {form.imageUrl && (
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={() => set('imageUrl', '')}
                >
                  Xóa ảnh
                </Button>
              )}
            </Stack>
          </Stack>

          <TextField
            label="Tên sản phẩm"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            fullWidth
            required
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Mã SKU (tùy chọn)" value={form.sku} onChange={(e) => set('sku', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={categories ?? []}
                value={form.category}
                onInputChange={(_, v) => set('category', v)}
                renderInput={(params) => <TextField {...params} label="Danh mục" />}
              />
            </Grid>
          </Grid>

          <TextField
            label="Mô tả"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Số lượng tồn"
                type="number"
                value={form.quantity}
                onChange={(e) => set('quantity', Math.max(0, parseInt(e.target.value || '0', 10)))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <MoneyField label="Giá nhập" value={form.importPrice} onChange={(v) => set('importPrice', v)} fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <MoneyField label="Giá bán" value={form.salePrice} onChange={(v) => set('salePrice', v)} fullWidth />
            </Grid>
          </Grid>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                label="Khuyến mãi"
                type="number"
                value={form.promotionPercent}
                onChange={(e) =>
                  set('promotionPercent', Math.min(100, Math.max(0, parseFloat(e.target.value || '0'))))
                }
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ bgcolor: '#f2f6f3', borderRadius: 2, px: 2, py: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Giá bán thực tế
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {finalPrice.toLocaleString('vi-VN')} đ
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <FormControlLabel
            control={<Switch checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />}
            label="Đang kinh doanh"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Hủy
        </Button>
        <Button onClick={onSubmit} variant="contained" disabled={save.isPending || uploading}>
          {product ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
