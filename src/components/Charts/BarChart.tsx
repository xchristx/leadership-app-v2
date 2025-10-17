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
  [key: string]: string | number | undefined;
}

interface TooltipPayload {
  value: number;
  dataKey: string;
  color: string;
  name: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
}

interface CustomBarChartProps {
  data: BarChartData[] | Record<string, string | number>[];
  title?: string;
  dataKey?: string;
  nameKey?: string;
  xKey?: string;
  yKeys?: string[];
  colors?: string[];
  height?: number;
  color?: string;
  showLegend?: boolean;
  showGrid?: boolean;
}

export function CustomBarChart({
  data,
  title,
  dataKey = 'value',
  nameKey = 'name',
  xKey,
  yKeys,
  colors = [],
  height = 300,
  color,
  showLegend = false,
  showGrid = true,
}: CustomBarChartProps) {
  const theme = useTheme();

  const defaultColor = color || theme.palette.primary.main;

  // Determine which key to use for X axis
  const xAxisKey = xKey || nameKey;

  // Determine which keys to use for bars
  const barKeys = yKeys || [dataKey];

  // Generate colors for multiple bars
  const barColors = colors.length > 0 ? colors : [defaultColor];

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const displayLabel = String(label || '');

      return (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
            {displayLabel}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" color="text.primary">
              <span style={{ color: entry.color }}>●</span> {entry.name}: {entry.value}
            </Typography>
          ))}
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

          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} stroke={theme.palette.text.secondary} />

          <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} stroke={theme.palette.text.secondary} />

          <Tooltip content={CustomTooltip} />

          {(showLegend || yKeys) && (
            <Legend
              wrapperStyle={{
                color: theme.palette.text.secondary,
                fontSize: '12px',
              }}
            />
          )}

          {barKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={barColors[index % barColors.length]}
              radius={[4, 4, 0, 0]}
              stroke={theme.palette.background.paper}
              strokeWidth={1}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
