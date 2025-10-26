import { Box, Typography, Button, Alert, Grid } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';

interface ExistingEvaluationStepProps {
  email: string;
  allowReEvaluation: boolean;
  onEditEvaluation: () => void;
  onChangeEmail: () => void;
}

export function ExistingEvaluationStep({ email, allowReEvaluation, onEditEvaluation, onChangeEmail }: ExistingEvaluationStepProps) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <CheckCircleIcon
        sx={{
          fontSize: { xs: 60, md: 80 },
          color: 'warning.main',
          mb: 2,
        }}
      />

      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: 'warning.main',
          fontSize: { xs: '1.5rem', md: '2rem' },
        }}
      >
        Evaluación Existente Detectada
      </Typography>

      <Typography
        variant="h6"
        color="text.secondary"
        sx={{
          mb: 3,
          fontSize: { xs: '1rem', md: '1.25rem' },
          px: { xs: 1, md: 0 },
        }}
      >
        Encontramos una evaluación previa con el email: <strong>{email}</strong>
      </Typography>

      <Alert
        severity={allowReEvaluation ? 'info' : 'warning'}
        sx={{
          mb: 4,
          textAlign: 'left',
          mx: { xs: 0, md: 2 },
          maxWidth: 600,
          marginX: 'auto',
        }}
      >
        <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
          {allowReEvaluation
            ? 'Este proyecto permite editar evaluaciones. Puedes modificar tus respuestas anteriores.'
            : 'Este proyecto NO permite editar evaluaciones una vez enviadas.'}
        </Typography>
      </Alert>

      <Grid container spacing={3} sx={{ maxWidth: 400, mx: 'auto' }}>
        <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          {allowReEvaluation ? (
            <>
              <Button
                variant="contained"
                size="large"
                onClick={onEditEvaluation}
                sx={{
                  px: { xs: 4, md: 6 },
                  py: 1.5,
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  fontWeight: 'bold',
                  borderRadius: 3,
                  width: '100%',
                  maxWidth: '300px',
                }}
              >
                Editar Mi Evaluación
              </Button>
              <Button
                variant="outlined"
                onClick={onChangeEmail}
                sx={{
                  px: 4,
                  py: 1,
                  width: '100%',
                  maxWidth: '300px',
                }}
              >
                Cambiar Email
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={onChangeEmail}
              sx={{
                px: { xs: 4, md: 6 },
                py: 1.5,
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 'bold',
                borderRadius: 3,
                width: '100%',
                maxWidth: '300px',
              }}
            >
              Usar Otro Email
            </Button>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
