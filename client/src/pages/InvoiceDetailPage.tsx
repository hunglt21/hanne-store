import { useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import IosShareIcon from '@mui/icons-material/IosShare';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { toPng } from 'html-to-image';
import { useSnackbar } from 'notistack';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import BillPreview, { type BillData } from '../components/BillPreview';
import { useDeleteInvoice, useInvoice } from '../hooks/useInvoices';
import { apiError } from '../lib/api';
import { formatVnd, formatDateTime } from '../lib/format';

const STATUS_LABEL: Record<string, { label: string; color: 'success' | 'default' | 'warning' }> = {
  confirmed: { label: 'Đã xác nhận', color: 'success' },
  draft: { label: 'Nháp', color: 'warning' },
  cancelled: { label: 'Đã hủy', color: 'default' },
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { data: invoice, isLoading } = useInvoice(Number(id));
  const del = useDeleteInvoice();
  const billRef = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={160} height={40} />
        <Skeleton variant="rounded" height={520} sx={{ mt: 2, maxWidth: 420, mx: 'auto' }} />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <EmptyState
        title="Không tìm thấy hóa đơn"
        action={
          <Button component={RouterLink} to="/invoices" variant="contained">
            Về danh sách
          </Button>
        }
      />
    );
  }

  const billData: BillData = {
    code: invoice.code,
    createdAt: invoice.createdAt,
    customerName: invoice.customerName,
    customerPhone: invoice.customerPhone,
    items: (invoice.items ?? []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    total: invoice.total,
    amountPaid: invoice.amountPaid,
    note: invoice.note,
  };

  const profit = invoice.total - invoice.costTotal;

  const renderPng = async () => {
    const node = billRef.current;
    if (!node) return null;
    // Capture the FULL rendered size (not the possibly-clipped viewport width),
    // so no column gets cut off on narrow screens.
    const width = node.scrollWidth;
    const height = node.scrollHeight;
    return toPng(node, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      style: { margin: '0', maxWidth: 'none' },
    });
  };

  const saveImage = async () => {
    setBusy(true);
    try {
      const dataUrl = await renderPng();
      if (!dataUrl) return;
      const link = document.createElement('a');
      link.download = `hoa-don-${invoice.code}.png`;
      link.href = dataUrl;
      link.click();
      enqueueSnackbar('Đã lưu ảnh hóa đơn', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(apiError(err, 'Không thể tạo ảnh'), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const shareImage = async () => {
    setBusy(true);
    try {
      const dataUrl = await renderPng();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `hoa-don-${invoice.code}.png`, { type: 'image/png' });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: `Hóa đơn ${invoice.code}`, text: `Hóa đơn ${invoice.code} - ${invoice.customerName}` });
      } else {
        await saveImage();
      }
    } catch {
      /* user cancelled share */
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await del.mutateAsync(invoice.id);
      enqueueSnackbar('Đã xóa hóa đơn (hoàn lại tồn kho)', { variant: 'success' });
      navigate('/invoices');
    } catch (err) {
      enqueueSnackbar(apiError(err), { variant: 'error' });
    }
  };

  const status = STATUS_LABEL[invoice.status] ?? STATUS_LABEL.confirmed;

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" className="no-print" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/invoices')} color="inherit">
          Hóa đơn
        </Button>
        <Chip label={status.label} color={status.color} size="small" />
      </Stack>

      {/* Off-screen, fixed-width copy used ONLY for image capture — never clipped.
          Marked no-print so it doesn't interfere with the printable bill below. */}
      <Box className="no-print" sx={{ position: 'absolute', left: -9999, top: 0, pointerEvents: 'none' }} aria-hidden>
        <BillPreview ref={billRef} data={billData} fixedWidth />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={5}>
          <BillPreview data={billData} />

          <Stack direction="row" spacing={1} sx={{ mt: 2, maxWidth: 420, mx: 'auto' }} className="no-print">
            <Button variant="contained" fullWidth startIcon={<IosShareIcon />} onClick={shareImage} disabled={busy}>
              Chia sẻ
            </Button>
            <Button variant="outlined" fullWidth startIcon={<ImageOutlinedIcon />} onClick={saveImage} disabled={busy}>
              Lưu ảnh
            </Button>
            <Button variant="outlined" color="inherit" onClick={() => window.print()} sx={{ minWidth: 0, px: 1.5 }}>
              <PrintOutlinedIcon />
            </Button>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6} lg={7} className="no-print">
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Thông tin hóa đơn
                </Typography>
                <Stack spacing={1}>
                  <Row label="Mã hóa đơn" value={invoice.code} />
                  <Row label="Thời gian" value={formatDateTime(invoice.createdAt)} />
                  <Row
                    label="Khách hàng"
                    value={
                      invoice.customerId ? (
                        <Button
                          component={RouterLink}
                          to={`/customers/${invoice.customerId}`}
                          size="small"
                          startIcon={<PersonOutlineIcon />}
                          sx={{ py: 0 }}
                        >
                          {invoice.customerName}
                        </Button>
                      ) : (
                        invoice.customerName
                      )
                    }
                  />
                  <Row label="Số sản phẩm" value={`${(invoice.items ?? []).reduce((s, i) => s + i.quantity, 0)} sp`} />
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: '#f2f6f3' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Hạch toán (chỉ chủ shop thấy)
                </Typography>
                <Stack spacing={1}>
                  <Row label="Doanh thu" value={formatVnd(invoice.total)} />
                  <Row label="Vốn hàng" value={formatVnd(invoice.costTotal)} />
                  <Box sx={{ borderTop: '1px dashed #cdddd2', pt: 1 }}>
                    <Row
                      label="Lợi nhuận"
                      value={
                        <Typography sx={{ fontWeight: 800, color: profit >= 0 ? 'primary.main' : 'error.main' }}>
                          {formatVnd(profit)}
                        </Typography>
                      }
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => setDeleting(true)}
              sx={{ alignSelf: 'flex-start' }}
            >
              Xóa hóa đơn
            </Button>
          </Stack>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={deleting}
        title="Xóa hóa đơn"
        message="Xóa hóa đơn này? Số lượng sản phẩm đã bán sẽ được hoàn lại vào kho."
        danger
        confirmText="Xóa"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(false)}
      />
    </Box>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ fontWeight: 600, textAlign: 'right' }}>{value}</Box>
    </Stack>
  );
}
