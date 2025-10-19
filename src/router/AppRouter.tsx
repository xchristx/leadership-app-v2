// ============================================================================
// CONFIGURACIÓN DE RUTAS
// ============================================================================
// Router principal con rutas protegidas, públicas y lazy loading
// ============================================================================

import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Layout, ProtectedRoute, PublicRoute } from '../components';
import { useAppDispatch } from '../store';
import { checkAuth } from '../store/slices/authSlice';

// Lazy loading de páginas
const Dashboard = lazy(() => import('../pages').then(m => ({ default: m.Dashboard })));
const ProjectsModular = lazy(() => import('../pages/ProjectsModular').then(m => ({ default: m.ProjectsModular })));
const ProjectDetailPage = lazy(() => import('../pages/ProjectDetailPageSimple'));
const TeamDetailPage = lazy(() => import('../pages/TeamDetailPage'));
const TeamsModular = lazy(() => import('../pages/TeamsModular').then(m => ({ default: m.TeamsModular })));
const Evaluations = lazy(() => import('../pages').then(m => ({ default: m.Evaluations })));
const QuestionnairesPage = lazy(() => import('../pages/QuestionnairesPage'));
const Reports = lazy(() => import('../pages').then(m => ({ default: m.Reports })));
const LoginPage = lazy(() => import('../pages').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../components').then(m => ({ default: m.RegisterPage })));
const EvaluationPage = lazy(() => import('../pages/EvaluationPage').then(m => ({ default: m.EvaluationPage })));

// Componente de loading
function LoadingSpinner() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
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

// Wrapper para páginas protegidas con layout
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
      </Layout>
    </ProtectedRoute>
  );
}

// Wrapper para páginas públicas
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicRoute>
      <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
    </PublicRoute>
  );
}

export function AppRouter() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    // Verificar autenticación al cargar la app
    dispatch(checkAuth());
  }, [dispatch]);
  return (
    <Router>
      <Routes>
        {/* Ruta raíz - redirigir al dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Rutas públicas (solo accesibles sin autenticación) */}
        <Route
          path="/login"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />

        <Route
          path="/register"
          element={
            <PublicLayout>
              <RegisterPage />
            </PublicLayout>
          }
        />

        {/* Ruta de evaluación pública (sin autenticación requerida) */}
        <Route
          path="/evaluation/:token"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <EvaluationPage />
            </Suspense>
          }
        />

        {/* Rutas protegidas (requieren autenticación) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedLayout>
              <ProjectsModular />
            </ProtectedLayout>
          }
        />

        <Route
          path="/teams"
          element={
            <ProtectedLayout>
              <TeamsModular />
            </ProtectedLayout>
          }
        />

        {/* Rutas de detalle para navegación jerárquica */}
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedLayout>
              <ProjectDetailPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/projects/:projectId/teams/:teamId"
          element={
            <ProtectedLayout>
              <TeamDetailPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/evaluations"
          element={
            <ProtectedLayout>
              <Evaluations />
            </ProtectedLayout>
          }
        />

        <Route
          path="/questionnaires"
          element={
            <ProtectedLayout>
              <QuestionnairesPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedLayout>
              <Reports />
            </ProtectedLayout>
          }
        />

        {/* Rutas de administración (solo admin/super_admin) */}
        <Route
          path="/organization"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h4">Gestión de Organización</Typography>
                    <Typography variant="body1" color="text.secondary">
                      Panel de administración en desarrollo
                    </Typography>
                  </Box>
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h4">Configuración</Typography>
                    <Typography variant="body1" color="text.secondary">
                      Panel de configuración en desarrollo
                    </Typography>
                  </Box>
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 404 */}
        <Route
          path="*"
          element={
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
              <Typography variant="h4" color="error">
                404 - Página no encontrada
              </Typography>
              <Typography variant="body1" color="text.secondary" align="center">
                La página que buscas no existe.
              </Typography>
            </Box>
          }
        />
      </Routes>
    </Router>
  );
}
