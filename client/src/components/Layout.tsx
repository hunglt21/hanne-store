import { useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../auth/AuthContext';
import BrandLogo from './BrandLogo';

const DRAWER_WIDTH = 264;

const NAV: { label: string; to: string; icon: ReactNode }[] = [
  { label: 'Tổng quan', to: '/', icon: <DashboardOutlinedIcon /> },
  { label: 'Sản phẩm', to: '/products', icon: <Inventory2OutlinedIcon /> },
  { label: 'Khách hàng', to: '/customers', icon: <PeopleAltOutlinedIcon /> },
  { label: 'Hóa đơn', to: '/invoices', icon: <ReceiptLongOutlinedIcon /> },
  { label: 'Thống kê', to: '/stats', icon: <InsightsOutlinedIcon /> },
  { label: 'Cài đặt', to: '/settings', icon: <SettingsOutlinedIcon /> },
];

function isActive(pathname: string, to: string) {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(to + '/');
}

export default function Layout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const currentTitle = NAV.find((n) => isActive(location.pathname, n.to))?.label ?? 'Hanne Store';

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <BrandLogo size={40} radius={10} />
        <Box>
          <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>Hanne Authentic</Typography>
          <Typography variant="caption" color="text.secondary">
            Kho & bán hàng
          </Typography>
        </Box>
      </Box>
      <Divider />

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => {
            navigate('/invoices/new');
            setMobileOpen(false);
          }}
        >
          Tạo hóa đơn
        </Button>
      </Box>

      <List sx={{ px: 1.5, flex: 1 }}>
        {NAV.map((item) => {
          const active = isActive(location.pathname, item.to);
          return (
            <ListItemButton
              key={item.to}
              component={Link}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: active ? 'primary.main' : 'text.secondary',
                bgcolor: active ? 'rgba(46,139,87,0.10)' : 'transparent',
                '&:hover': { bgcolor: active ? 'rgba(46,139,87,0.16)' : 'rgba(0,0,0,0.04)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontWeight: active ? 700 : 500 }} primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <BrandLogo size={36} radius="50%" alt={user?.name || 'Tài khoản'} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            @{user?.username}
          </Typography>
        </Box>
        <Tooltip title="Đăng xuất">
          <IconButton onClick={logout} size="small">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Mobile top bar */}
      {!isDesktop && (
        <AppBar
          position="fixed"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <IconButton edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 700, flex: 1 }}>{currentTitle}</Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate('/invoices/new')}
            >
              Hóa đơn
            </Button>
          </Toolbar>
        </AppBar>
      )}

      {/* Navigation drawer */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            open
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                borderRight: '1px solid',
                borderColor: 'divider',
              },
            }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minWidth: 0,
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
          mt: { xs: 7, md: 0 },
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
