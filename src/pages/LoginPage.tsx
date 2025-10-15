// ============================================================================
// PÁGINA DE LOGIN MEJORADA
// ============================================================================
// Componente de login con Supabase y fallback simulado
// ============================================================================

import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Stack, CircularProgress, Container } from '@mui/material';
import * as yup from 'yup';
import { useAuth } from '../hooks';
import type { LoginCredentials } from '../types';

const validationSchema = yup.object({
  email: yup.string().email('Ingresa un email válido').required('El email es requerido'),
  password: yup.string().min(6, 'La contraseña debe tener al menos 6 caracteres').required('La contraseña es requerida'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error, signIn } = useAuth();

  const formik = useFormik<LoginCredentials>({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async values => {
      const result = await signIn(values);
      if (result.success) {
        navigate('/dashboard');
      }
    },
  });

  if (isAuthenticated) {
    return null; // Será redirigido por el useEffect
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Leadership App
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sistema de Evaluación de Liderazgo
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={formik.handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />

                <TextField
                  fullWidth
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  disabled={isLoading}
                  autoComplete="current-password"
                />

                <Button type="submit" variant="contained" size="large" disabled={isLoading || !formik.isValid} sx={{ mt: 2, py: 1.5 }}>
                  {isLoading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
                </Button>
              </Stack>
            </form>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                ¿Eres líder o colaborador?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accede mediante el enlace de invitación que recibiste por correo.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
