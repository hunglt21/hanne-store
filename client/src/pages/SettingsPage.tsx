import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import { useSnackbar } from "notistack";
import PageHeader from "../components/PageHeader";
import { api, apiError } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (newPassword.length < 4) {
      enqueueSnackbar("Mật khẩu mới tối thiểu 4 ký tự", { variant: "warning" });
      return;
    }
    if (newPassword !== confirm) {
      enqueueSnackbar("Xác nhận mật khẩu không khớp", { variant: "warning" });
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      enqueueSnackbar("Đổi mật khẩu thành công, vui lòng đăng nhập lại", {
        variant: "success",
      });
      setTimeout(logout, 1200);
    } catch (err) {
      enqueueSnackbar(apiError(err), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Cài đặt" subtitle="Tài khoản và thông tin ứng dụng" />

      <Stack spacing={2} sx={{ maxWidth: 560 }}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Tài khoản
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Đang đăng nhập với <b>{user?.name}</b> (@{user?.username})
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Đổi mật khẩu
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Mật khẩu hiện tại"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                fullWidth
                autoComplete="current-password"
              />
              <TextField
                label="Mật khẩu mới"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                autoComplete="new-password"
              />
              <TextField
                label="Xác nhận mật khẩu mới"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                fullWidth
                autoComplete="new-password"
              />
              <Button
                variant="contained"
                startIcon={<LockResetIcon />}
                onClick={submit}
                disabled={loading || !currentPassword || !newPassword}
                sx={{ alignSelf: "flex-start" }}
              >
                Đổi mật khẩu
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Về ứng dụng
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <b>Hanne Store</b> — hệ thống quản lý kho & bán hàng chạy hoàn
              toàn trên máy của bạn. Dữ liệu được lưu cục bộ (SQLite), không gửi
              lên bất kỳ dịch vụ bên thứ ba nào.
            </Typography>
            <Alert
              severity="info"
              variant="outlined"
              sx={{ mt: 2, borderRadius: 2 }}
            >
              Mẹo: dùng nút <b>Chia sẻ</b> / <b>Lưu ảnh</b> ở màn hình hóa đơn
              để gửi bill cho khách qua Zalo, Messenger...
            </Alert>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
