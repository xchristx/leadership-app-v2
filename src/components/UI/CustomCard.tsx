// ============================================================================
// COMPONENTE CARD REUTILIZABLE
// ============================================================================
// Card customizado con variantes y estilos consistentes
// ============================================================================

import { Card, CardHeader, CardContent, CardActions, Typography, IconButton, Box, Divider, Skeleton } from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

export interface CustomCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  headerActions?: React.ReactNode;
  variant?: 'outlined' | 'elevated' | 'filled';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CustomCard({
  title,
  subtitle,
  children,
  actions,
  headerActions,
  variant = 'outlined',
  size = 'medium',
  loading = false,
  onClick,
  className,
}: CustomCardProps) {
  const elevationMap = {
    outlined: 0,
    elevated: 2,
    filled: 0,
  };

  const paddingMap = {
    small: 1,
    medium: 2,
    large: 3,
  };

  const cardProps = {
    variant: (variant === 'filled' ? 'outlined' : variant === 'elevated' ? 'elevation' : variant) as 'outlined' | 'elevation',
    elevation: elevationMap[variant],
    sx: {
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease-in-out',
      ...(variant === 'filled' && {
        bgcolor: 'grey.50',
        borderColor: 'transparent',
      }),
      ...(onClick && {
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: 4,
        },
      }),
    },
    onClick,
    className,
  };

  if (loading) {
    return (
      <Card {...cardProps}>
        {(title || subtitle) && <CardHeader title={<Skeleton width="60%" />} subheader={subtitle && <Skeleton width="40%" />} />}
        <CardContent sx={{ pt: title ? 0 : undefined, p: paddingMap[size] }}>
          <Skeleton variant="rectangular" height={120} />
        </CardContent>
        {actions && (
          <CardActions>
            <Skeleton width={80} height={32} />
          </CardActions>
        )}
      </Card>
    );
  }

  return (
    <Card {...cardProps}>
      {(title || subtitle || headerActions) && (
        <>
          <CardHeader
            title={
              title && (
                <Typography variant="h6" component="h2">
                  {title}
                </Typography>
              )
            }
            subheader={
              subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )
            }
            action={
              headerActions || (
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              )
            }
            sx={{ pb: 1 }}
          />
          <Divider />
        </>
      )}

      <CardContent
        sx={{
          pt: title ? 2 : undefined,
          p: paddingMap[size],
          '&:last-child': { pb: paddingMap[size] },
        }}
      >
        {children}
      </CardContent>

      {actions && (
        <>
          <Divider />
          <CardActions sx={{ p: paddingMap[size], pt: 1 }}>{actions}</CardActions>
        </>
      )}
    </Card>
  );
}

// Variantes predefinidas
export function StatsCard({
  title,
  value,
  change,
  icon,
  loading = false,
}: {
  title: string;
  value: string | number;
  change?: { value: number; label: string };
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <CustomCard loading={loading} variant="elevated" size="medium">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
            {loading ? <Skeleton width={60} /> : value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? <Skeleton width={80} /> : title}
          </Typography>
          {change && !loading && (
            <Typography
              variant="caption"
              color={change.value >= 0 ? 'success.main' : 'error.main'}
              sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
            >
              {change.value >= 0 ? '+' : ''}
              {change.value}% {change.label}
            </Typography>
          )}
        </Box>
        {icon && <Box sx={{ color: 'primary.main', fontSize: '2rem' }}>{icon}</Box>}
      </Box>
    </CustomCard>
  );
}
