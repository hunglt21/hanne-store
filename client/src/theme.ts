import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2e8b57', dark: '#237046', light: '#4fa576', contrastText: '#ffffff' },
    secondary: { main: '#d6607f', contrastText: '#ffffff' },
    success: { main: '#2e8b57' },
    warning: { main: '#e8940c' },
    error: { main: '#dc3545' },
    background: { default: '#f4f7f4', paper: '#ffffff' },
    text: { primary: '#1f2a24', secondary: '#5b6b62' },
    divider: '#e6ede8',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Be Vietnam Pro", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10, paddingInline: 16 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: 16, border: '1px solid #e6ede8', backgroundImage: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 16 } },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, color: '#3c4a42', backgroundColor: '#f2f6f3' },
      },
    },
    MuiTooltip: { defaultProps: { arrow: true } },
  },
});

export default theme;
