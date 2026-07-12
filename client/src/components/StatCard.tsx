import { Box, Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export default function StatCard({
  label,
  value,
  icon,
  color = '#2e8b57',
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  color?: string;
  hint?: ReactNode;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        {icon && (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              color,
              bgcolor: `${color}1a`,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25, mt: 0.25 }}>
            {value}
          </Typography>
          {hint && (
            <Typography variant="caption" color="text.secondary">
              {hint}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
