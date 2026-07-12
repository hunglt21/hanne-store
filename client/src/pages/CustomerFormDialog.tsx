import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { useSaveCustomer } from '../hooks/useCustomers';
import { apiError } from '../lib/api';
import type { Customer } from '../types';

interface FormState {
  name: string;
  phone: string;
  address: string;
  note: string;
  isVip: boolean;
}

const EMPTY: FormState = { name: '', phone: '', address: '', note: '', isVip: false };

export default function CustomerFormDialog({
  open,
  customer,
  onClose,
}: {
  open: boolean;
  customer?: Customer | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const save = useSaveCustomer();
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(
      customer
        ? {
            name: customer.name,
            phone: customer.phone ?? '',
            address: customer.address ?? '',
            note: customer.note ?? '',
            isVip: customer.isVip,
          }
        : EMPTY
    );
  }, [open, customer]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    if (!form.name.trim()) {
      enqueueSnackbar('Vui lòng nhập tên khách hàng', { variant: 'warning' });
      return;
    }
    try {
      await save.mutateAsync({ ...form, id: customer?.id });
      enqueueSnackbar(customer ? 'Đã cập nhật khách hàng' : 'Đã thêm khách hàng', { variant: 'success' });
      onClose();
    } catch (err) {
      enqueueSnackbar(apiError(err), { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={fullScreen}>
      <DialogTitle sx={{ fontWeight: 700 }}>{customer ? 'Sửa khách hàng' : 'Thêm khách hàng'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <TextField label="Tên khách hàng" value={form.name} onChange={(e) => set('name', e.target.value)} fullWidth required autoFocus />
          <TextField label="Số điện thoại" value={form.phone} onChange={(e) => set('phone', e.target.value)} fullWidth inputProps={{ inputMode: 'tel' }} />
          <TextField label="Địa chỉ" value={form.address} onChange={(e) => set('address', e.target.value)} fullWidth />
          <TextField label="Ghi chú" value={form.note} onChange={(e) => set('note', e.target.value)} fullWidth multiline minRows={2} />
          <FormControlLabel
            control={<Switch checked={form.isVip} onChange={(e) => set('isVip', e.target.checked)} />}
            label="Khách hàng thân thiết (VIP)"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Hủy
        </Button>
        <Button onClick={onSubmit} variant="contained" disabled={save.isPending}>
          {customer ? 'Lưu thay đổi' : 'Thêm khách hàng'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
