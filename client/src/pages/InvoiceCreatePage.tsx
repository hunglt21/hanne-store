import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import { useSnackbar } from 'notistack';
import PageHeader from '../components/PageHeader';
import MoneyField from '../components/MoneyField';
import BillPreview, { type BillData } from '../components/BillPreview';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { useCreateInvoice } from '../hooks/useInvoices';
import { useDebounce } from '../hooks/useDebounce';
import { apiError } from '../lib/api';
import { formatVnd } from '../lib/format';
import type { CustomerWithStats, Product } from '../types';

interface CartItem {
  productId: number | null;
  name: string;
  quantity: number;
  unitPrice: number;
  importPrice: number;
  stock?: number;
}

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const create = useCreateInvoice();

  // Customer
  const [customer, setCustomer] = useState<CustomerWithStats | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [custInput, setCustInput] = useState('');
  const custQ = useDebounce(custInput, 250);
  const { data: custData } = useCustomers({ q: custQ || undefined });

  // Product search
  const [prodInput, setProdInput] = useState('');
  const prodQ = useDebounce(prodInput, 250);
  const { data: prodData } = useProducts({ q: prodQ || undefined });

  // Cart + totals
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState('');
  const [payFull, setPayFull] = useState(true);
  const [amountPaid, setAmountPaid] = useState(0);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [items]);
  const total = Math.max(0, subtotal - discount);
  const paid = payFull ? total : amountPaid;

  const addProduct = (p: Product) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      const unitPrice = Math.round(p.salePrice * (1 - p.promotionPercent / 100));
      return [
        ...prev,
        { productId: p.id, name: p.name, quantity: 1, unitPrice, importPrice: p.importPrice, stock: p.quantity },
      ];
    });
  };

  const updateItem = (index: number, patch: Partial<CartItem>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const billData: BillData = {
    code: 'MỚI',
    createdAt: new Date(),
    customerName: customerName || 'Khách lẻ',
    customerPhone: customerPhone || null,
    items: items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.unitPrice * i.quantity })),
    subtotal,
    discount,
    total,
    amountPaid: paid,
    note: note || null,
  };

  const save = async (status: 'confirmed' | 'draft') => {
    if (items.length === 0) {
      enqueueSnackbar('Thêm ít nhất 1 sản phẩm vào hóa đơn', { variant: 'warning' });
      return;
    }
    try {
      const inv = await create.mutateAsync({
        customerId: customer?.id ?? null,
        customerName: customerName || 'Khách lẻ',
        customerPhone: customerPhone || null,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          importPrice: i.importPrice,
        })),
        discount,
        amountPaid: paid,
        note: note || null,
        status,
      });
      enqueueSnackbar(status === 'draft' ? 'Đã lưu nháp' : 'Đã tạo hóa đơn', { variant: 'success' });
      navigate(`/invoices/${inv.id}`);
    } catch (err) {
      enqueueSnackbar(apiError(err), { variant: 'error' });
    }
  };

  return (
    <Box sx={{ pb: { xs: 10, md: 0 } }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/invoices')} sx={{ mb: 1 }} color="inherit">
        Hóa đơn
      </Button>
      <PageHeader title="Tạo hóa đơn" subtitle="Chọn khách hàng và thêm sản phẩm để lên đơn" />

      <Grid container spacing={2}>
        {/* Builder */}
        <Grid item xs={12} md={7}>
          <Stack spacing={2}>
            {/* Customer */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Khách hàng
                </Typography>
                <Autocomplete
                  freeSolo
                  options={custData?.data ?? []}
                  getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
                  filterOptions={(x) => x}
                  onInputChange={(_, v) => {
                    setCustInput(v);
                    setCustomerName(v);
                    setCustomer(null);
                  }}
                  onChange={(_, value) => {
                    if (value && typeof value !== 'string') {
                      setCustomer(value);
                      setCustomerName(value.name);
                      setCustomerPhone(value.phone ?? '');
                    }
                  }}
                  renderOption={(props, option) =>
                    typeof option === 'string' ? null : (
                      <li {...props} key={option.id}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {option.name} {option.isVip && '⭐'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.phone || 'Chưa có SĐT'} · {formatVnd(option.totalSpent)}
                          </Typography>
                        </Box>
                      </li>
                    )
                  }
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Tìm hoặc nhập tên khách (để trống = Khách lẻ)" />
                  )}
                />
                <TextField
                  label="Số điện thoại"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  fullWidth
                  sx={{ mt: 1.5 }}
                  inputProps={{ inputMode: 'tel' }}
                />
              </CardContent>
            </Card>

            {/* Product search */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Sản phẩm
                </Typography>
                <Autocomplete
                  options={prodData?.data ?? []}
                  getOptionLabel={(o) => o.name}
                  filterOptions={(x) => x}
                  value={null}
                  blurOnSelect
                  clearOnBlur
                  onInputChange={(_, v) => setProdInput(v)}
                  onChange={(_, value) => value && addProduct(value)}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Stack direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {option.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Tồn: {option.quantity}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {formatVnd(Math.round(option.salePrice * (1 - option.promotionPercent / 100)))}
                        </Typography>
                      </Stack>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Tìm sản phẩm để thêm..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                {/* Cart items */}
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {items.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      Chưa có sản phẩm nào. Tìm và thêm ở trên.
                    </Typography>
                  )}
                  {items.map((it, index) => (
                    <Box key={index} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, pr: 1 }}>
                          {it.name}
                          {it.stock !== undefined && it.quantity > it.stock && (
                            <Chip size="small" color="warning" label="Vượt tồn kho" sx={{ ml: 1, height: 20 }} />
                          )}
                        </Typography>
                        <IconButton size="small" color="error" onClick={() => removeItem(index)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => updateItem(index, { quantity: Math.max(1, it.quantity - 1) })}
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <TextField
                            value={it.quantity}
                            onChange={(e) => updateItem(index, { quantity: Math.max(1, parseInt(e.target.value || '1', 10)) })}
                            sx={{ width: 56 }}
                            inputProps={{ style: { textAlign: 'center' }, inputMode: 'numeric' }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => updateItem(index, { quantity: it.quantity + 1 })}
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        <MoneyField
                          value={it.unitPrice}
                          onChange={(v) => updateItem(index, { unitPrice: v })}
                          sx={{ flex: 1 }}
                          label="Đơn giá"
                        />
                        <Box sx={{ minWidth: 96, textAlign: 'right' }}>
                          <Typography variant="caption" color="text.secondary">
                            Thành tiền
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {formatVnd(it.unitPrice * it.quantity)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Thanh toán
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Tổng tiền hàng</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{formatVnd(subtotal)}</Typography>
                  </Stack>
                  <MoneyField label="Giảm giá" value={discount} onChange={setDiscount} fullWidth />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography sx={{ fontWeight: 700 }}>Khách phải trả</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {formatVnd(total)}
                    </Typography>
                  </Stack>
                  <FormControlLabel
                    control={<Checkbox checked={payFull} onChange={(e) => setPayFull(e.target.checked)} />}
                    label="Khách trả đủ"
                  />
                  {!payFull && (
                    <MoneyField label="Khách trả" value={amountPaid} onChange={setAmountPaid} fullWidth />
                  )}
                  <TextField
                    label="Ghi chú (VD: TẶNG MASK)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Live preview */}
        <Grid item xs={12} md={5}>
          <Box sx={{ position: { md: 'sticky' }, top: { md: 16 } }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Xem trước hóa đơn
            </Typography>
            <BillPreview data={billData} />
            <Stack direction="row" spacing={1} sx={{ mt: 2 }} className="no-print">
              <Button
                variant="outlined"
                fullWidth
                onClick={() => save('draft')}
                disabled={create.isPending}
              >
                Lưu nháp
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={() => save('confirmed')}
                disabled={create.isPending}
              >
                Lưu & xác nhận
              </Button>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
