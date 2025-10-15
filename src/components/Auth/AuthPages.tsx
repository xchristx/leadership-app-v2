// ============================================================================
// PÁGINAS DE AUTENTICACIÓN
// ============================================================================
// Páginas de login, registro y recuperación de contraseña
// ============================================================================

import { Box, Container, Paper, Typography, TextField, Button, Link, Alert, Divider } from '@mui/material';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';

// Esquemas de validación
const loginSchema = Yup.object({
  email: Yup.string().email('Email inválido').required('Email es obligatorio'),
  password: Yup.string().min(6, 'Mínimo 6 caracteres').required('Contraseña es obligatoria'),
});

const registerSchema = Yup.object({
  firstName: Yup.string().min(2, 'Mínimo 2 caracteres').required('Nombre es obligatorio'),
  lastName: Yup.string().min(2, 'Mínimo 2 caracteres').required('Apellido es obligatorio'),
  email: Yup.string().email('Email inválido').required('Email es obligatorio'),
  password: Yup.string().min(6, 'Mínimo 6 caracteres').required('Contraseña es obligatoria'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Confirmar contraseña es obligatorio'),
  organizationName: Yup.string().min(3, 'Mínimo 3 caracteres').required('Nombre de la organización es obligatorio'),
});

// Página de Login
export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (values: { email: string; password: string }, { setSubmitting }: any) => {
    try {
      setError(null);
      const result = await signIn(values);

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error inesperado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Iniciar Sesión
          </Typography>

          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Accede a tu cuenta de Leadership Eval
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Formik initialValues={{ email: '', password: '' }} validationSchema={loginSchema} onSubmit={handleSubmit}>
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Field
                    as={TextField}
                    name="email"
                    type="email"
                    label="Email"
                    fullWidth
                    error={touched.email && !!errors.email}
                    helperText={<ErrorMessage name="email" />}
                    disabled={isSubmitting}
                  />

                  <Field
                    as={TextField}
                    name="password"
                    type="password"
                    label="Contraseña"
                    fullWidth
                    error={touched.password && !!errors.password}
                    helperText={<ErrorMessage name="password" />}
                    disabled={isSubmitting}
                  />

                  <Button type="submit" fullWidth variant="contained" size="large" disabled={isSubmitting} sx={{ mt: 2 }}>
                    {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              ¿No tienes cuenta?{' '}
              <Link component={RouterLink} to="/register">
                Regístrate aquí
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

// Página de Registro
export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (
    values: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      confirmPassword: string;
      organizationName: string;
    },
    { setSubmitting }: any
  ) => {
    try {
      setError(null);
      setSuccess(null);

      const result = await signUp({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        organizationName: values.organizationName,
      });

      if (result.success) {
        setSuccess('Cuenta creada exitosamente. Verifica tu email para continuar.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.error || 'Error al crear la cuenta');
      }
    } catch (err) {
      setError('Error inesperado');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Crear Cuenta
          </Typography>

          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Regístrate para comenzar a usar Leadership Eval
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Formik
            initialValues={{
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              confirmPassword: '',
              organizationName: '',
            }}
            validationSchema={registerSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Field
                      as={TextField}
                      name="firstName"
                      label="Nombre"
                      fullWidth
                      error={touched.firstName && !!errors.firstName}
                      helperText={<ErrorMessage name="firstName" />}
                      disabled={isSubmitting}
                    />

                    <Field
                      as={TextField}
                      name="lastName"
                      label="Apellido"
                      fullWidth
                      error={touched.lastName && !!errors.lastName}
                      helperText={<ErrorMessage name="lastName" />}
                      disabled={isSubmitting}
                    />
                  </Box>

                  <Field
                    as={TextField}
                    name="organizationName"
                    label="Nombre de la Organización"
                    fullWidth
                    error={touched.organizationName && !!errors.organizationName}
                    helperText={<ErrorMessage name="organizationName" />}
                    disabled={isSubmitting}
                  />

                  <Field
                    as={TextField}
                    name="email"
                    type="email"
                    label="Email"
                    fullWidth
                    error={touched.email && !!errors.email}
                    helperText={<ErrorMessage name="email" />}
                    disabled={isSubmitting}
                  />

                  <Field
                    as={TextField}
                    name="password"
                    type="password"
                    label="Contraseña"
                    fullWidth
                    error={touched.password && !!errors.password}
                    helperText={<ErrorMessage name="password" />}
                    disabled={isSubmitting}
                  />

                  <Field
                    as={TextField}
                    name="confirmPassword"
                    type="password"
                    label="Confirmar Contraseña"
                    fullWidth
                    error={touched.confirmPassword && !!errors.confirmPassword}
                    helperText={<ErrorMessage name="confirmPassword" />}
                    disabled={isSubmitting}
                  />

                  <Button type="submit" fullWidth variant="contained" size="large" disabled={isSubmitting} sx={{ mt: 2 }}>
                    {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              ¿Ya tienes cuenta?{' '}
              <Link component={RouterLink} to="/login">
                Inicia sesión aquí
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
