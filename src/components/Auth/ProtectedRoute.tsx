// ============================================================================
// COMPONENTE RUTA PROTEGIDA
// ============================================================================
// Wrapper para rutas que requieren autenticación
// ============================================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: ('user' | 'admin' | 'super_admin')[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, profile, isInitialized } = useAuth();
  const location = useLocation();

  // Mostrar loading solo si no está inicializado o está cargando
  if (!isInitialized || isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Verificando autenticación...
        </Typography>
      </Box>
    );
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar roles si se especifican (solo si hay perfil)
  if (roles && roles.length > 0 && profile) {
    const userRole = profile.role;
    if (!roles.includes(userRole)) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 2,
            p: 3,
          }}
        >
          <Typography variant="h5" color="error">
            Acceso Denegado
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            No tienes permisos para acceder a esta página.
          </Typography>
        </Box>
      );
    }
  }

  return <>{children}</>;
}

// Componente para rutas públicas (solo accesibles sin autenticación)
interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (!isInitialized || isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Cargando...
        </Typography>
      </Box>
    );
  }

  // Redirigir al dashboard si ya está autenticado
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
