import { useState } from 'react';
import { Box, Card, Typography, TextField, Button, Grid, alpha, useTheme } from '@mui/material';
import { Shield } from '@mui/icons-material';

interface EvaluatorInfo {
  name: string;
  email: string;
  additionalInfo: string;
}

interface EvaluatorInfoStepProps {
  evaluatorInfo: EvaluatorInfo;
  onEvaluatorInfoChange: (info: EvaluatorInfo) => void;
  onSubmit: () => void;
  isLeader: boolean;
  requireEvaluatorInfo: boolean;
}

export function EvaluatorInfoStep({
  evaluatorInfo,
  onEvaluatorInfoChange,
  onSubmit,
  isLeader,
  requireEvaluatorInfo,
}: EvaluatorInfoStepProps) {
  const theme = useTheme();
  const [emailError, setEmailError] = useState('');
  const infoMessage = isLeader
    ? 'Como líder, tu evaluación ayuda a identificar oportunidades de mejora en el equipo. Tus respuestas se manejarán con confidencialidad; los resultados se mostrarán únicamente de forma agregada para proteger tu identidad. Proporciona ejemplos concretos cuando sea posible.'
    : 'Como colaborador, tus respuestas son anónimas y confidenciales. Usaremos la información de forma agregada para mejorar el liderazgo y las condiciones de trabajo. Evita incluir información personal identificable en los campos abiertos.';

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleEmailChange = (email: string) => {
    onEvaluatorInfoChange({ ...evaluatorInfo, email });
    if (email.trim() !== '' && !isValidEmail(email)) {
      setEmailError('Ingresa un email válido (ejemplo: usuario@dominio.com)');
    } else {
      setEmailError('');
    }
  };

  const canSubmit = requireEvaluatorInfo
    ? evaluatorInfo.name.trim() && evaluatorInfo.email.trim() && isValidEmail(evaluatorInfo.email)
    : true;

  return (
    <Box>
      <Card
        elevation={8}
        sx={{
          p: 3,
          mb: 4,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.1),
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Shield color="primary" />
          <Typography variant="h6" fontWeight="600">
            Información Protegida
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {infoMessage}
        </Typography>
      </Card>

      {isLeader || requireEvaluatorInfo ? (
        <Grid container spacing={3} sx={{ maxWidth: 600, mx: 'auto' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre completo"
              value={evaluatorInfo.name}
              onChange={e => onEvaluatorInfoChange({ ...evaluatorInfo, name: e.target.value })}
              required
              variant="outlined"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="email"
              label="Email *"
              value={evaluatorInfo.email}
              onChange={e => handleEmailChange(e.target.value)}
              required
              variant="outlined"
              error={!!emailError}
              helperText={emailError}
            />
          </Grid>

          <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={onSubmit}
              disabled={!canSubmit}
              sx={{
                px: { xs: 4, md: 6 },
                py: 1.5,
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 'bold',
                borderRadius: 3,
                minWidth: { xs: '200px', md: '250px' },
              }}
            >
              Comenzar Evaluación
            </Button>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3} sx={{ maxWidth: 600, mx: 'auto' }}>
          <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={onSubmit}
              sx={{
                px: { xs: 4, md: 6 },
                py: 1.5,
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 'bold',
                borderRadius: 3,
                minWidth: { xs: '200px', md: '250px' },
              }}
            >
              Comenzar Evaluación Anónima
            </Button>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
