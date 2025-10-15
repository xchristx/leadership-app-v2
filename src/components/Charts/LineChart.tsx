// ============================================================================
// COMPONENTE DE GRÁFICO DE LÍNEAS
// ============================================================================
// Gráfico de líneas responsivo usando Recharts para mostrar tendencias
// ============================================================================

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Paper, Typography, useTheme } from '@mui/material';

interface LineChartData {
  name: string;
  value: number;
  date?: string;
  [key: string]: string | number | undefined;
}

interface CustomLineChartProps {
  data: LineChartData[];
  title?: string;
  dataKey?: string;
  nameKey?: string;
  height?: number;
  color?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
  strokeWidth?: number;
  formatTooltip?: (value: number, name: string) => string;
}

export function CustomLineChart({
  data,
  title,
  dataKey = 'value',
  nameKey = 'name',
  height = 300,
  color,
  showLegend = false,
  showGrid = true,
  showDots = true,
  strokeWidth = 2,
  formatTooltip,
}: CustomLineChartProps) {
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
        <LineChart
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

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={defaultColor}
            strokeWidth={strokeWidth}
            dot={showDots ? { fill: defaultColor, strokeWidth: 2, r: 4 } : false}
            activeDot={{ r: 6, fill: defaultColor, strokeWidth: 2, stroke: theme.palette.background.paper }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
