import { forwardRef } from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { formatNumber, formatVnd, formatDate } from "../lib/format";

export interface BillItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BillData {
  code: string;
  createdAt: string | Date;
  customerName: string;
  customerPhone?: string | null;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  note?: string | null;
}

const SHOP_NAME = "HANNE AUTHENTIC";
const SHOP_TAGLINE = "Mỹ phẩm chính hãng";

/**
 * A printable / screenshot-friendly sales bill (PHIẾU TÍNH TIỀN),
 * modelled on the shop's paper receipts. Narrow width suits phone screenshots.
 */
const BillPreview = forwardRef<HTMLDivElement, { data: BillData }>(
  ({ data }, ref) => {
    const totalQty = data.items.reduce((s, i) => s + i.quantity, 0);
    const change = data.amountPaid - data.total;

    return (
      <Box
        ref={ref}
        className="print-area"
        sx={{
          width: "100%",
          maxWidth: 420,
          mx: "auto",
          bgcolor: "#fff",
          color: "#1f2a24",
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #e6ede8",
          boxShadow: "0 6px 24px rgba(31,42,36,0.08)",
          fontFamily: '"Be Vietnam Pro", Inter, sans-serif',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: "#2e8b57",
            color: "#fff",
            px: 3,
            pt: 2.5,
            pb: 2,
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              letterSpacing: 2,
              fontSize: 13,
              opacity: 0.9,
            }}
          >
            {SHOP_NAME}
          </Typography>
          <Typography sx={{ fontSize: 11, opacity: 0.85 }}>
            {SHOP_TAGLINE}
          </Typography>
          <Typography
            sx={{ fontWeight: 800, fontSize: 22, mt: 1, letterSpacing: 0.5 }}
          >
            HÓA ĐƠN BÁN HÀNG
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Meta */}
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 0.5 }}
          >
            <Typography sx={{ fontSize: 13, color: "#5b6b62" }}>
              Mã đơn
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              {data.code}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 0.5 }}
          >
            <Typography sx={{ fontSize: 13, color: "#5b6b62" }}>
              Ngày
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              {formatDate(data.createdAt)}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ fontSize: 13, color: "#5b6b62" }}>
              Khách hàng
            </Typography>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                {data.customerName}
              </Typography>
              {data.customerPhone && (
                <Typography sx={{ fontSize: 12, color: "#5b6b62" }}>
                  {data.customerPhone}
                </Typography>
              )}
            </Box>
          </Stack>

          <Divider sx={{ my: 2, borderStyle: "dashed" }} />

          {/* Items table */}
          <Box>
            <Stack
              direction="row"
              sx={{ pb: 1, color: "#5b6b62", fontSize: 12, fontWeight: 700 }}
            >
              <Box sx={{ flex: 1 }}>Sản phẩm</Box>
              <Box sx={{ width: 32, textAlign: "center" }}>SL</Box>
              <Box sx={{ width: 72, textAlign: "right" }}>Đơn giá</Box>
              <Box sx={{ width: 84, textAlign: "right" }}>Thành tiền</Box>
            </Stack>
            {data.items.map((it, i) => (
              <Stack
                key={i}
                direction="row"
                sx={{
                  py: 1,
                  fontSize: 13,
                  alignItems: "flex-start",
                  bgcolor: i % 2 === 1 ? "#f4f8f5" : "transparent",
                  borderRadius: 1,
                  px: 0.5,
                  mx: -0.5,
                }}
              >
                <Box sx={{ flex: 1, pr: 1, fontWeight: 600, lineHeight: 1.3 }}>
                  {it.name}
                </Box>
                <Box sx={{ width: 32, textAlign: "center" }}>{it.quantity}</Box>
                <Box sx={{ width: 72, textAlign: "right", color: "#5b6b62" }}>
                  {formatNumber(it.unitPrice)}
                </Box>
                <Box sx={{ width: 84, textAlign: "right", fontWeight: 700 }}>
                  {formatNumber(it.lineTotal)}
                </Box>
              </Stack>
            ))}
          </Box>

          <Divider sx={{ my: 2, borderStyle: "dashed" }} />

          {/* Totals */}
          <Stack spacing={0.75}>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ fontSize: 13, color: "#5b6b62" }}>
                Tổng cộng ({totalQty} sp)
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                {formatVnd(data.subtotal)}
              </Typography>
            </Stack>
            {data.discount > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: "#5b6b62" }}>
                  Giảm giá
                </Typography>
                <Typography
                  sx={{ fontSize: 13, fontWeight: 600, color: "#d6607f" }}
                >
                  - {formatVnd(data.discount)}
                </Typography>
              </Stack>
            )}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 0.5, pt: 1, borderTop: "2px solid #2e8b57" }}
            >
              <Typography sx={{ fontSize: 15, fontWeight: 800 }}>
                Thanh toán
              </Typography>
              <Typography
                sx={{ fontSize: 20, fontWeight: 800, color: "#2e8b57" }}
              >
                {formatVnd(data.total)}
              </Typography>
            </Stack>
            {data.amountPaid > 0 && (
              <>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: 13, color: "#5b6b62" }}>
                    Khách trả
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                    {formatVnd(data.amountPaid)}
                  </Typography>
                </Stack>
                {change > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 13, color: "#5b6b62" }}>
                      Tiền thừa
                    </Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                      {formatVnd(change)}
                    </Typography>
                  </Stack>
                )}
              </>
            )}
          </Stack>

          {data.note && (
            <Box sx={{ mt: 2, bgcolor: "#fbeef2", borderRadius: 2, p: 1.5 }}>
              <Typography
                sx={{ fontSize: 12, fontWeight: 700, color: "#d6607f" }}
              >
                Ghi chú
              </Typography>
              <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
                {data.note}
              </Typography>
            </Box>
          )}

          <Typography
            sx={{ textAlign: "center", mt: 3, fontSize: 12, color: "#5b6b62" }}
          >
            Cảm ơn quý khách! Hẹn gặp lại 💚
          </Typography>
        </Box>
      </Box>
    );
  },
);

BillPreview.displayName = "BillPreview";
export default BillPreview;
