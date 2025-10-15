// ============================================================================
// COMPONENTE DE GRÁFICO CIRCULAR (PIE CHART)
// ============================================================================
// Gráfico circular responsivo usando Recharts para mostrar distribuciones
// ============================================================================

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Paper, Typography, useTheme } from '@mui/material';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

interface CustomPieChartProps {
  data: PieChartData[];
  title?: string;
  height?: number;
  colors?: string[];
  showLegend?: boolean;

  innerRadius?: number;
  outerRadius?: number;
  formatTooltip?: (value: number, name: string) => string;
}

export function CustomPieChart({
  data,
  title,
  height = 300,
  colors,
  showLegend = true,

  innerRadius = 0,
  outerRadius = 100,
  formatTooltip,
}: CustomPieChartProps) {
  const theme = useTheme();

  // Colores por defecto basados en el tema
  const defaultColors = colors || [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    '#9c27b0', // Purple
    '#ff5722', // Deep Orange
    '#607d8b', // Blue Grey
    '#795548', // Brown
  ];

  // Calcular porcentajes
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  const dataWithPercentages = data.map((entry, index) => ({
    ...entry,
    percentage: total > 0 ? Math.round((entry.value / total) * 100) : 0,
    color: entry.color || defaultColors[index % defaultColors.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formattedValue = formatTooltip ? formatTooltip(data.value, data.name) : `${data.name}: ${data.value} (${data.percentage}%)`;

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
        <PieChart>
          <Pie
            data={dataWithPercentages}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {dataWithPercentages.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>

          <Tooltip content={CustomTooltip} />

          {showLegend && (
            <Legend
              wrapperStyle={{
                color: theme.palette.text.secondary,
                fontSize: '12px',
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}
