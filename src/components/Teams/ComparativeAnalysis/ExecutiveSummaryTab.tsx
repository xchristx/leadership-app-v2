// ============================================================================
// COMPONENTE EXECUTIVE SUMMARY TAB
// ============================================================================
// Pestaña de resumen ejecutivo con métricas principales
// ============================================================================

import { Grid, Card, CardContent, Typography, Box, LinearProgress, Chip, Paper } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import type { AnalysisMetrics } from './types';

interface ExecutiveSummaryTabProps {
  metrics: AnalysisMetrics | null;
  categorySummary: Array<{
    category: string;
    auto_total: number;
    otros_total: number;
  }>;
  loading: boolean;
}

export function ExecutiveSummaryTab({ metrics }: ExecutiveSummaryTabProps) {
  return (
    <Grid sx={{ px: { xs: 1, md: 10, lg: 30, xl: 40 } }} container spacing={3}>
      {/* Métricas principales */}
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          📈 Métricas Clave
        </Typography>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={{ bgcolor: 'success.50', border: 1, borderColor: 'success.200' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              {metrics?.aligned_questions || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Preguntas Alineadas
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={{ bgcolor: 'warning.50', border: 1, borderColor: 'warning.200' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
              {metrics?.moderate_differences || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Diferencias Moderadas
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={{ bgcolor: 'error.50', border: 1, borderColor: 'error.200' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <ErrorIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              {metrics?.significant_differences || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Diferencias Críticas
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={{ bgcolor: 'info.50', border: 1, borderColor: 'info.200' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
              {metrics?.overall_satisfaction.toFixed(1) || '0.0'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Satisfacción General
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Estado general */}
      <Grid size={{ xs: 12 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              🎯 Estado General del Equipo
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Nivel de Alineación Promedio
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics ? (1 - metrics.average_alignment / 4) * 100 : 0}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor:
                      metrics && metrics.average_alignment < 0.5
                        ? 'success.main'
                        : metrics && metrics.average_alignment < 1
                        ? 'warning.main'
                        : 'error.main',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {metrics ? `Diferencia promedio: ${metrics.average_alignment.toFixed(2)} puntos` : 'Sin datos'}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Typography color="black" variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    👑 Tendencia del Líder
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {metrics?.leader_trend === 'positive' && <TrendingUpIcon color="success" />}
                    {metrics?.leader_trend === 'negative' && <TrendingDownIcon color="error" />}
                    {metrics?.leader_trend === 'neutral' && <BarChartIcon color="warning" />}
                    <Chip
                      label={
                        metrics?.leader_trend === 'positive' ? 'Positiva' : metrics?.leader_trend === 'negative' ? 'Negativa' : 'Neutral'
                      }
                      color={metrics?.leader_trend === 'positive' ? 'success' : metrics?.leader_trend === 'negative' ? 'error' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, bgcolor: 'secondary.50' }}>
                  <Typography color="black" variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    👥 Tendencia de Colaboradores
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {metrics?.collaborator_trend === 'positive' && <TrendingUpIcon color="success" />}
                    {metrics?.collaborator_trend === 'negative' && <TrendingDownIcon color="error" />}
                    {metrics?.collaborator_trend === 'neutral' && <BarChartIcon color="warning" />}
                    <Chip
                      label={
                        metrics?.collaborator_trend === 'positive'
                          ? 'Positiva'
                          : metrics?.collaborator_trend === 'negative'
                          ? 'Negativa'
                          : 'Neutral'
                      }
                      color={
                        metrics?.collaborator_trend === 'positive'
                          ? 'success'
                          : metrics?.collaborator_trend === 'negative'
                          ? 'error'
                          : 'warning'
                      }
                      size="small"
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
