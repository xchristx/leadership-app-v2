// ============================================================================
// COMPONENTE DE MÉTRICAS DEL DASHBOARD
// ============================================================================
// Tarjetas de métricas con gráficos para el dashboard principal
// ============================================================================

import { Card, CardContent, Typography, Box, useTheme, Stack } from '@mui/material';
import { CustomBarChart, CustomLineChart, CustomPieChart } from '../Charts';

// Datos de ejemplo para los gráficos
const teamMetricsData = [
  { name: 'Equipo A', value: 85 },
  { name: 'Equipo B', value: 92 },
  { name: 'Equipo C', value: 78 },
  { name: 'Equipo D', value: 88 },
  { name: 'Equipo E', value: 95 },
];

const evaluationTrendData = [
  { name: 'Ene', value: 65 },
  { name: 'Feb', value: 72 },
  { name: 'Mar', value: 78 },
  { name: 'Abr', value: 85 },
  { name: 'May', value: 82 },
  { name: 'Jun', value: 88 },
];

const statusDistributionData = [
  { name: 'Completadas', value: 45 },
  { name: 'En progreso', value: 25 },
  { name: 'Pendientes', value: 20 },
  { name: 'Canceladas', value: 10 },
];

interface DashboardMetricsProps {
  // Props para personalizar datos en el futuro
  teamData?: Array<{ name: string; value: number }>;
  trendData?: Array<{ name: string; value: number }>;
  statusData?: Array<{ name: string; value: number }>;
}

export function DashboardMetrics({
  teamData = teamMetricsData,
  trendData = evaluationTrendData,
  statusData = statusDistributionData,
}: DashboardMetricsProps) {
  const theme = useTheme();

  return (
    <Stack spacing={3}>
      {/* Gráficos principales */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 3,
        }}
      >
        {/* Métricas de Equipos */}
        <Card sx={{ flex: 1, height: '400px' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="text.primary">
              Puntuación por Equipo
            </Typography>
            <Box sx={{ height: '320px' }}>
              <CustomBarChart data={teamData} height={320} color={theme.palette.primary.main} />
            </Box>
          </CardContent>
        </Card>

        {/* Tendencia de Evaluaciones */}
        <Card sx={{ flex: 1, height: '400px' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="text.primary">
              Tendencia de Evaluaciones
            </Typography>
            <Box sx={{ height: '320px' }}>
              <CustomLineChart data={trendData} height={320} color={theme.palette.secondary.main} strokeWidth={3} />
            </Box>
          </CardContent>
        </Card>

        {/* Distribución de Estados */}
        <Card sx={{ flex: 1, height: '400px' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="text.primary">
              Estado de Evaluaciones
            </Typography>
            <Box sx={{ height: '320px' }}>
              <CustomPieChart
                data={statusData}
                height={320}
                colors={[theme.palette.success.main, theme.palette.warning.main, theme.palette.info.main, theme.palette.error.main]}
                formatTooltip={(value, name) => `${name}: ${value} evaluaciones`}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Resumen de Estadísticas */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom color="text.primary">
            Resumen General
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 3,
              justifyContent: 'space-around',
            }}
          >
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {teamData.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Equipos Evaluados
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {statusData.find(item => item.name === 'Completadas')?.value || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Evaluaciones Completadas
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {Math.round(teamData.reduce((sum, item) => sum + item.value, 0) / teamData.length)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Puntuación Promedio
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" color="info.main">
                {Math.round(
                  ((statusData.find(item => item.name === 'Completadas')?.value || 0) /
                    statusData.reduce((sum, item) => sum + item.value, 0)) *
                    100
                )}
                %
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tasa de Finalización
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}
