import { Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface CompleteStepProps {
  name: string;
}

export function CompleteStep({ name }: CompleteStepProps) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <CheckCircleIcon sx={{ fontSize: { xs: 80, md: 120 }, color: 'success.main', mb: 3 }} />
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
        ¡Evaluación Completada!
      </Typography>
      <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, fontSize: { xs: '1rem', md: '1.25rem' } }}>
        Gracias por tu participación, <strong>{name}</strong>
      </Typography>
      <Box sx={{ backgroundColor: 'success.light', borderRadius: 2, p: { xs: 2, md: 3 }, mb: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', md: '1.1rem' } }}>
          Tu evaluación ha sido registrada exitosamente. Los resultados serán procesados y estarán disponibles para el análisis del
          proyecto.
        </Typography>
      </Box>
    </Box>
  );
}
