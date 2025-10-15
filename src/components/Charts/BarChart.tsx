// ============================================================================
// COMPONENTE DE GRÁFICO DE BARRAS
// ============================================================================
// Gráfico de barras responsivo usando Recharts para métricas y comparaciones
// ============================================================================

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Paper, Typography, useTheme } from '@mui/material';

interface BarChartData {
  name: string;
  value: number;
  label?: string;
  color?: string;
}

interface CustomBarChartProps {
  data: BarChartData[];
  title?: string;
  dataKey?: string;
  nameKey?: string;
  height?: number;
  color?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  formatTooltip?: (value: number, name: string) => string;
}

export function CustomBarChart({
  data,
  title,
  dataKey = 'value',
  nameKey = 'name',
  height = 300,
  color,
  showLegend = false,
  showGrid = true,
  formatTooltip,
}: CustomBarChartProps) {
  const theme = useTheme();

  const defaultColor = color || theme.palette.primary.main;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const displayLabel = String(label || '');
      const formattedValue = formatTooltip ? formatTooltip(value, displayLabel) : `${displayLabel}: ${value}`;

      return (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" color="text.primary">
            {formattedValue}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      {title && (
        <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 2, color: 'text.primary' }}>
          {title}
        </Typography>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}

          <XAxis dataKey={nameKey} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} stroke={theme.palette.text.secondary} />

          <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} stroke={theme.palette.text.secondary} />

          <Tooltip content={CustomTooltip} />

          {showLegend && (
            <Legend
              wrapperStyle={{
                color: theme.palette.text.secondary,
                fontSize: '12px',
              }}
            />
          )}

          <Bar dataKey={dataKey} fill={defaultColor} radius={[4, 4, 0, 0]} stroke={theme.palette.background.paper} strokeWidth={1} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
