// ============================================================================
// PÁGINA DE DETALLES DEL EQUIPO
// ============================================================================
// Vista completa de un equipo específico con dashboard completo
// ============================================================================

import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Breadcrumbs, Link, Alert, Skeleton, IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Group as GroupIcon, NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useProjects } from '../hooks/useProjects';
import { useTeams } from '../hooks/useTeams';
import { TeamDashboard } from '../components/Teams/index';

function TeamDetailPage() {
  const { projectId, teamId } = useParams<{ projectId: string; teamId: string }>();
  const navigate = useNavigate();

  // Hooks para datos
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects();
  const { teams, isLoading: teamsLoading, error: teamsError } = useTeams();

  // Encontrar datos actuales
  const currentProject = projects?.find(p => p.id === projectId);
  const currentTeam = teams?.find(t => t.id === teamId);

  // Handlers para navegación
  const handleBackToProject = () => {
    navigate(`/projects/${projectId}`);
  };

  const handleBackToProjects = () => {
    navigate('/projects');
  };

  if (projectsLoading || teamsLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Skeleton variant="text" width="300px" height="40px" />
        <Skeleton variant="rectangular" width="100%" height="200px" sx={{ mt: 2 }} />
      </Container>
    );
  }

  if (projectsError || teamsError) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">Error al cargar los datos</Alert>
      </Container>
    );
  }

  if (!currentProject || !currentTeam) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning">Equipo o proyecto no encontrado</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBackToProjects} sx={{ mt: 2 }}>
          Volver a Proyectos
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="#"
          onClick={e => {
            e.preventDefault();
            handleBackToProjects();
          }}
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          Proyectos
        </Link>
        <Link
          color="inherit"
          href="#"
          onClick={e => {
            e.preventDefault();
            handleBackToProject();
          }}
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          {currentProject.name}
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <GroupIcon sx={{ mr: 1 }} />
          {currentTeam.name}
        </Typography>
      </Breadcrumbs>

      {/* Header simple con navegación */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBackToProject} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Dashboard del Equipo
        </Typography>
      </Box>

      {/* Usar TeamDashboard completo */}
      {teamId && <TeamDashboard teamId={teamId} />}
    </Container>
  );
}

export default TeamDetailPage;
