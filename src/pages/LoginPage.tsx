// ============================================================================
// PÁGINA DE LOGIN MEJORADA - DISEÑO ACTUALIZADO
// ============================================================================
// Componente de login con diseño moderno y mejor UX
// ============================================================================

import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
  CircularProgress,
  CardMedia,
  Fade,
  Zoom,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import * as yup from 'yup';
import { useAuth } from '../hooks';
import type { LoginCredentials } from '../types';
import { Visibility, VisibilityOff, Email, Lock, CorporateFare } from '@mui/icons-material';
import { useState } from 'react';

const validationSchema = yup.object({
  email: yup.string().email('Ingresa un email válido').required('El email es requerido'),
  password: yup.string().min(6, 'La contraseña debe tener al menos 6 caracteres').required('La contraseña es requerida'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error, signIn } = useAuth();
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);

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

  const handleClickShowPassword = () => setShowPassword(show => !show);

  if (isAuthenticated) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          borderRadius: '0 0 50% 50%',
          transform: 'scale(1.2)',
        },
      }}
    >
      <Zoom in={true} timeout={800}>
        <Card
          sx={{
            width: '100%',
            maxWidth: { xs: 340, sm: 400, md: 450 },
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            background: theme.palette.background.paper,
            mx: { xs: 1, sm: 2 },
            border: `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(10px)',
            position: 'relative',
            zIndex: 1,
            overflow: 'visible',
          }}
        >
          {/* Header con gradiente */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              py: 4,
              px: 3,
              textAlign: 'center',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 100,
                height: 100,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
              },
            }}
          >
            <Fade in={true} timeout={1000}>
              <Box>
                <CardMedia
                  component="img"
                  src="/logo2.png"
                  alt="Logo"
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    mb: 2,
                    background: 'rgba(255,255,255,0.9)',
                    objectFit: 'contain',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    border: '3px solid rgba(255,255,255,0.8)',
                    mx: 'auto',
                  }}
                />
                <Typography
                  variant="h4"
                  component="h1"
                  fontWeight="bold"
                  sx={{
                    letterSpacing: 1,
                    mb: 0.5,
                    fontSize: { xs: '1.8rem', md: '2.2rem' },
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  Hector Ordoñez
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    opacity: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  <CorporateFare sx={{ fontSize: 20 }} />
                  Sistema de Evaluación de Liderazgo
                </Typography>
              </Box>
            </Fade>
          </Box>

          <CardContent sx={{ p: { xs: 2, sm: 3, md: 5 }, pt: { xs: 2, sm: 3, md: 4 } }}>
            {error && (
              <Fade in={true}>
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.error.light}`,
                  }}
                >
                  {error}
                </Alert>
              </Fade>
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: `0 0 0 2px ${theme.palette.primary.light}40`,
                      },
                      '&.Mui-focused': {
                        boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`,
                      },
                    },
                    input: {
                      fontSize: '1rem',
                      py: { xs: 1, sm: 1.5 },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Contraseña"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  disabled={isLoading}
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                          sx={{ color: 'text.secondary' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: `0 0 0 2px ${theme.palette.primary.light}40`,
                      },
                      '&.Mui-focused': {
                        boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`,
                      },
                    },
                    input: {
                      fontSize: '1rem',
                      py: { xs: 1, sm: 1.5 },
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading || !formik.isValid}
                  sx={{
                    mt: 2,
                    py: { xs: 1.2, sm: 1.8 },
                    fontWeight: 'bold',
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: 'white',
                    textTransform: 'none',
                    letterSpacing: 0.5,
                    boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: '0 12px 32px rgba(76, 175, 80, 0.4)',
                      transform: 'translateY(-2px)',
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      transition: 'left 0.5s',
                    },
                    '&:hover::before': {
                      left: '100%',
                    },
                  }}
                >
                  {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Iniciar Sesión'}
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 4, opacity: 0.6 }} />

            <Fade in={true} timeout={1200}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    fontSize: '0.95rem',
                  }}
                >
                  ¿Eres líder o colaborador?
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.6,
                    fontSize: '0.9rem',
                  }}
                >
                  Accede mediante el enlace de invitación
                  <br />
                  que recibiste por correo electrónico.
                </Typography>
              </Box>
            </Fade>
          </CardContent>
        </Card>
      </Zoom>
    </Box>
  );
}
