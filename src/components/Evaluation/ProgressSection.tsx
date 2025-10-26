import { Paper, Grid, Typography, Button, LinearProgress, Alert, Chip, CircularProgress, Box } from '@mui/material';

interface ProgressSectionProps {
  currentResponses: number;
  totalQuestions: number;
  isSubmitting: boolean;
  hasExistingEvaluation: boolean;
  onSubmit: () => void;
}

export function ProgressSection({ currentResponses, totalQuestions, isSubmitting, hasExistingEvaluation, onSubmit }: ProgressSectionProps) {
  const isComplete = currentResponses === totalQuestions;

  return (
    <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mt: 4, backgroundColor: 'background.default' }}>
      <Grid container spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
            Progreso de la evaluación
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
          <Chip label={`${currentResponses}/${totalQuestions} respondidas`} color={isComplete ? 'success' : 'warning'} variant="filled" />
        </Grid>
      </Grid>

      <LinearProgress variant="determinate" value={(currentResponses / totalQuestions) * 100} sx={{ height: 8, borderRadius: 4, mb: 3 }} />

      {/* Alerta para respuestas incompletas */}
      {currentResponses > 0 && !isComplete && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Atención:</strong> Te faltan {totalQuestions - currentResponses} preguntas por responder. Debes completar todas las
            preguntas antes de enviar la evaluación.
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={isSubmitting || !isComplete}
          size="large"
          sx={{
            px: { xs: 6, md: 8 },
            py: 2,
            fontSize: { xs: '1rem', md: '1.2rem' },
            fontWeight: 'bold',
            borderRadius: 3,
            minWidth: { xs: '200px', md: '250px' },
            opacity: !isComplete ? 0.7 : 1,
          }}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              {hasExistingEvaluation ? 'Actualizando...' : 'Enviando...'}
            </>
          ) : !isComplete ? (
            `Completa todas las preguntas (${currentResponses}/${totalQuestions})`
          ) : (
            <>{hasExistingEvaluation ? 'Actualizar Evaluación' : 'Enviar Evaluación'}</>
          )}
        </Button>
      </Box>
    </Paper>
  );
}
