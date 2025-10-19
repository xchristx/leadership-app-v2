// ============================================================================
// PÁGINA DE DETALLES DEL PROYECTO CON EQUIPOS
// ============================================================================
// Vista mejorada de un proyecto específico con gestión completa de equipos
// ============================================================================

import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Breadcrumbs,
  Link,
  Alert,
  Skeleton,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Avatar,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Group as GroupIcon,
  NavigateNext as NavigateNextIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useTeams } from '../hooks/useTeams';
import { TeamForm } from '../components/Forms';
import type { TeamFormData } from '../components/Forms/TeamForm';
import type { CreateTeamData } from '../services/teamService';

function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Estados locales
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Hooks para datos
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects();

  const { teams, isLoading: teamsLoading, error: teamsError, createTeamWithInvitations, deleteTeam, refetch } = useTeams();

  // Encontrar el proyecto actual
  const currentProject = projects?.find(p => p.id === projectId);

  // Filtrar equipos del proyecto actual
  const projectTeams = teams?.filter(team => team.project_id === projectId) || [];
  console.log({ teams });

  // Handlers
  const handleCreateTeam = async (teamData: TeamFormData) => {
    try {
      // Convertir TeamFormData a CreateTeamData
      const createData: CreateTeamData = {
        name: teamData.name,
        project_id: projectId!, // Usar el projectId actual
        team_size: teamData.team_size,
        is_active: teamData.is_active,
      };

      const result = await createTeamWithInvitations(createData);

      if (result.success) {
        setShowCreateDialog(false);
        refetch();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear equipo',
      };
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este equipo?')) {
      try {
        const result = await deleteTeam(teamId);

        if (result.success) {
          refetch();
        } else {
          console.error('Error al eliminar equipo:', result.error);
        }
      } catch (error) {
        console.error('Error al eliminar equipo:', error);
      }
    }
  };

  const handleTeamClick = (teamId: string) => {
    navigate(`/projects/${projectId}/teams/${teamId}`);
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

  if (!currentProject) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning">Proyecto no encontrado</Alert>
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
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          {currentProject.name}
        </Typography>
      </Breadcrumbs>

      {/* Header con información del proyecto */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBackToProjects} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {currentProject.name}
          </Typography>
          {currentProject.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {currentProject.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={currentProject.status === 'active' ? 'Activo' : currentProject.status}
              color={currentProject.status === 'active' ? 'success' : 'default'}
              size="small"
            />
            {currentProject.created_at && (
              <Chip label={`Creado: ${new Date(currentProject.created_at).toLocaleDateString()}`} variant="outlined" size="small" />
            )}
          </Box>
        </Box>

        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateDialog(true)} size="large">
          Agregar Equipo
        </Button>
      </Box>

      {/* Lista de equipos */}
      <Box>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon />
          Equipos del Proyecto ({projectTeams.length})
        </Typography>

        {projectTeams.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <CardContent>
              <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No hay equipos en este proyecto
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Crea el primer equipo para comenzar
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateDialog(true)} size="large">
                Crear Equipo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {projectTeams.map(team => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={team.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme =>
                        theme.palette.mode === 'light' ? '0 12px 32px rgba(0, 0, 0, 0.15)' : '0 12px 32px rgba(0, 0, 0, 0.7)',
                    },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    {/* Header del equipo */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <GroupIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Typography variant="h6" component="h3" noWrap>
                          {team.name}
                        </Typography>
                      </Box>

                      <Chip label={team.is_active ? 'Activo' : 'Inactivo'} color={team.is_active ? 'success' : 'default'} size="small" />
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Información del equipo */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {/* Líder */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Líder:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {team.leader_name || 'No asignado'}
                        </Typography>
                      </Box>

                      {/* Tamaño del equipo */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Miembros:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {team.team_size || 'No especificado'}
                        </Typography>
                      </Box>

                      {/* Fecha de creación */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Creado:
                        </Typography>
                        <Typography variant="body2">{new Date(team.created_at).toLocaleDateString('es-ES')}</Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Ver dashboard del equipo">
                        <Button
                          variant="contained"
                          startIcon={<VisibilityIcon />}
                          onClick={e => {
                            e.stopPropagation();
                            handleTeamClick(team.id);
                          }}
                          size="small"
                        >
                          Dashboard
                        </Button>
                      </Tooltip>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Eliminar equipo">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteTeam(team.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Floating Action Button para crear equipo */}
      <Fab
        color="primary"
        aria-label="agregar equipo"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        onClick={() => setShowCreateDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Diálogo para crear equipo */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon color="primary" />
            Crear Nuevo Equipo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Proyecto: {currentProject?.name}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TeamForm
            mode="create"
            onSubmit={handleCreateTeam}
            onCancel={() => setShowCreateDialog(false)}
            initialData={{ project_id: projectId }}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default ProjectDetailPage;
