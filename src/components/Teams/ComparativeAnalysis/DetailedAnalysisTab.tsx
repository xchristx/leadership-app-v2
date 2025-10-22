// ============================================================================
// COMPONENTE DETAILED ANALYSIS TAB
// ============================================================================
// Pestaña de análisis detallado pregunta por pregunta
// ============================================================================

import { Grid, Card, CardContent, Typography, Box, LinearProgress, Chip, Alert } from '@mui/material';
import type { ComparativeData } from './types';

interface DetailedAnalysisTabProps {
  comparativeData: ComparativeData[];
  loading: boolean;
}

export function DetailedAnalysisTab({ comparativeData }: DetailedAnalysisTabProps) {
  return (
    <Box sx={{ px: { xs: 1, md: 10, lg: 30, xl: 40 } }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        🔍 Análisis Pregunta por Pregunta
      </Typography>

      {comparativeData.length > 0 ? (
        <Grid container spacing={2}>
          {comparativeData.map((data, index) => {
            const difference = Math.abs(data.leader_avg - data.collaborators_avg);
            const maxValue = 5;
            const leaderPercentage = (data.leader_avg / maxValue) * 100;
            const collaboratorsPercentage = (data.collaborators_avg / maxValue) * 100;

            let differenceColor: 'success' | 'warning' | 'error' = 'success';
            if (difference > 1.5) differenceColor = 'error';
            else if (difference > 0.8) differenceColor = 'warning';

            return (
              <Grid size={{ xs: 12, lg: 6 }} key={data.question_id}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      Pregunta {index + 1}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {data.question_text}
                    </Typography>

                    {/* Barras comparativas */}
                    <Box sx={{ mb: 2 }}>
                      {/* Líder */}
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight="medium" color="primary.main">
                            👑 Líder
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="primary.main">
                            {data.leader_avg.toFixed(1)}/{maxValue}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={leaderPercentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'primary.100',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: 'primary.main',
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>

                      {/* Colaboradores */}
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight="medium" color="secondary.main">
                            👥 Colaboradores
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="secondary.main">
                            {data.collaborators_avg.toFixed(1)}/{maxValue}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={collaboratorsPercentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'secondary.100',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: 'secondary.main',
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Diferencia y estado */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip label={`Diferencia: ${difference.toFixed(1)}`} color={differenceColor} size="small" />
                      <Typography variant="caption" color="text.secondary">
                        {data.leader_count + data.collaborators_count} respuestas
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Alert severity="info">No hay datos suficientes para el análisis comparativo.</Alert>
      )}
    </Box>
  );
}
