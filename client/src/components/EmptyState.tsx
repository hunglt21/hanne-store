import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 6,
        px: 2,
        color: 'text.secondary',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {icon && <Box sx={{ fontSize: 48, color: 'text.disabled', lineHeight: 1 }}>{icon}</Box>}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
        {title}
      </Typography>
      {description && <Typography variant="body2">{description}</Typography>}
      {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
    </Box>
  );
}
