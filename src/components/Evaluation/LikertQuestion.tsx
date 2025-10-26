import { Box, Typography, Paper, LinearProgress, Grid } from '@mui/material';
import type { Question } from '../../types';

interface LikertQuestionProps {
  question: Question;
  response: string | number | undefined;
  onResponseChange: (questionId: string, value: string | number) => void;
}

export function LikertQuestion({ question, response, onResponseChange }: LikertQuestionProps) {
  const config = question.response_config as Record<string, unknown>;
  const scale = (config?.scale as number) || 5;
  const minLabel = (config?.min_label as string) || 'Totalmente en desacuerdo';
  const maxLabel = (config?.max_label as string) || 'Totalmente de acuerdo';
  const labels = config?.labels as string[] | undefined;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 'bold',
          mb: 2,
          color: 'primary.main',
          fontSize: { xs: '0.9rem', md: '1rem' },
        }}
      >
        Escala de Evaluación (1-{scale})
      </Typography>

      {/* Etiquetas de extremos */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
          px: 1,
          flexDirection: { xs: 'row', sm: 'row' },
          gap: { xs: 1, sm: 0 },
        }}
      >
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
              color: 'error.main',
              fontSize: { xs: '0.75rem', md: '0.875rem' },
            }}
          >
            {minLabel}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            (Puntuación: 1)
          </Typography>
        </Box>
        <Box sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 'bold',
              color: 'success.main',
              fontSize: { xs: '0.75rem', md: '0.875rem' },
            }}
          >
            {maxLabel}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            (Puntuación: {scale})
          </Typography>
        </Box>
      </Box>

      <Grid
        container
        spacing={{ xs: 0.5, md: 2 }}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
        }}
      >
        {Array.from({ length: scale }, (_, i) => i + 1).map((value, index) => {
          const isSelected = response === value;
          const intensity = (value - 1) / (scale - 1);

          return (
            <Grid
              size={{
                xs: scale <= 3 ? 4 : scale <= 5 ? 2.4 : 2,
                sm: scale <= 3 ? 4 : scale <= 5 ? 2.4 : 2,
                md: 12 / scale,
              }}
              sx={{ display: 'flex', justifyContent: 'center' }}
              key={index}
            >
              <Paper
                elevation={isSelected ? 6 : 2}
                sx={{
                  p: { xs: 0.4, md: 1.2 },
                  cursor: 'pointer',
                  backgroundColor: isSelected
                    ? intensity < 0.3
                      ? '#ffebee'
                      : intensity < 0.7
                      ? '#fff3e0'
                      : '#e8f5e8'
                    : 'background.paper',
                  border: '2px solid',
                  borderColor: isSelected
                    ? intensity < 0.3
                      ? 'error.main'
                      : intensity < 0.7
                      ? 'warning.main'
                      : 'success.main'
                    : 'divider',
                  transition: 'all 0.15s ease',
                  minHeight: { xs: 28, md: 60 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  '&:hover': {
                    elevation: 4,
                    transform: 'scale(1.02)',
                    borderColor: intensity < 0.3 ? 'error.light' : intensity < 0.7 ? 'warning.light' : 'success.light',
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                }}
                onClick={e => {
                  e.stopPropagation();
                  onResponseChange(question.id, value);
                }}
              >
                <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                  <Box
                    sx={{
                      width: { xs: 22, md: 30 },
                      height: { xs: 22, md: 30 },
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 0.5,
                      fontSize: { xs: '0.75rem', md: '0.95rem' },
                      fontWeight: 'bold',
                      color: isSelected ? 'black' : 'text.primary',
                      background: isSelected
                        ? intensity < 0.3
                          ? 'error.main'
                          : intensity < 0.7
                          ? 'warning.main'
                          : 'success.main'
                        : 'grey.400',
                      boxShadow: isSelected ? `0 3px 10px rgba(0,0,0,0.25)` : `0 2px 6px rgba(0,0,0,0.15)`,
                    }}
                  >
                    {value}
                  </Box>
                  {labels && labels[value - 1] && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: isSelected ? 'bold' : 'medium',
                        color: isSelected ? 'primary.main' : 'text.secondary',
                        fontSize: { xs: '0.55rem', md: '0.65rem' },
                        display: { xs: 'none', sm: 'block' },
                        lineHeight: 1.1,
                        textAlign: 'center',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {labels[value - 1]}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Barra de progreso visual */}
      {response && (
        <Box sx={{ mt: 2, px: 1 }}>
          <LinearProgress
            variant="determinate"
            value={((response as number) / scale) * 100}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor:
                  (response as number) < scale * 0.3 ? 'error.main' : (response as number) < scale * 0.7 ? 'warning.main' : 'success.main',
              },
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.5,
              display: 'block',
              textAlign: 'center',
              fontSize: { xs: '0.7rem', md: '0.8rem' },
            }}
          >
            Seleccionado: {response}/{scale}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
