// ============================================================================
// PÁGINA DE REPORTES
// ============================================================================
// Dashboard de reportes y analíticas
// ============================================================================

import { Box, Typography, Paper, Button } from '@mui/material';
import { BarChart as BarChartIcon, TrendingUp as TrendingUpIcon, Assessment as AssessmentIcon } from '@mui/icons-material';
import { CustomCard } from '../components';

export function Reports() {
  const handleGenerateReport = () => {
    // TODO: Implementar generación de reportes
    console.log('Generate report');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Reportes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Analiza el rendimiento y métricas de evaluación
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<BarChartIcon />} onClick={handleGenerateReport}>
          Generar Reporte
        </Button>
      </Box>

      {/* Contenido de reportes */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <CustomCard title="Rendimiento por Equipo" subtitle="Métricas de evaluación agrupadas por equipo">
          <Paper sx={{ p: 4, bgcolor: 'grey.50', textAlign: 'center' }}>
            <TrendingUpIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Gráficos de Rendimiento
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Los gráficos interactivos estarán disponibles próximamente
            </Typography>
          </Paper>
        </CustomCard>

        <CustomCard title="Análisis de Evaluaciones" subtitle="Estadísticas detalladas de las evaluaciones completadas">
          <Paper sx={{ p: 4, bgcolor: 'grey.50', textAlign: 'center' }}>
            <AssessmentIcon sx={{ fontSize: 64, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Dashboard Analítico
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistema de análisis en desarrollo
            </Typography>
          </Paper>
        </CustomCard>
      </Box>
    </Box>
  );
}
