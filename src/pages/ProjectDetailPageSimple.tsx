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
  Avatar,
  Fab,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Group as GroupIcon,
  NavigateNext as NavigateNextIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useTeams } from '../hooks/useTeams';
import { TeamCard } from '../components/Teams/TeamCard';
import { TeamForm } from '../components/Forms';
import { CreateProjectLeadershipDialog } from '../components/Teams/CreateProjectLeadershipDialog';
import { ProjectTeamsReport } from '../components/Projects/ProjectTeamsReport';
import type { Team, TeamFormData } from '../types';
import { TeamEditor } from '../components/Teams';
import type { UpdateTeamData } from '../types/index';

function ProjectDetailPage() {
  // Estado para edición de equipo
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Estados locales
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLeadershipDialog, setShowLeadershipDialog] = useState(false);
  const [showTeamsReport, setShowTeamsReport] = useState(false);

  // Hooks para datos
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects();

  const { teams, isLoading: teamsLoading, error: teamsError, createTeamWithInvitations, deleteTeam, refetch, updateTeam } = useTeams();

  // Encontrar el proyecto actual
  const currentProject = projects?.find(p => p.id === projectId);

  // Filtrar equipos del proyecto actual
  const projectTeams = teams?.filter(team => team.project_id === projectId) || [];

  // Separar equipo de liderazgo y equipos regulares
  const leadershipTeam = projectTeams.find(t => t.team_type === 'project_leadership');
  const regularTeams = projectTeams.filter(t => t.team_type !== 'project_leadership');
  // Handlers
  const handleCreateTeam = async (teamData: TeamFormData) => {
    try {
      // Convertir TeamFormData a CreateTeamData
      const createData: TeamFormData = {
        name: teamData.name,
        project_id: projectId!, // Usar el projectId actual
        team_size: teamData.team_size ?? undefined,
        is_active: teamData.is_active ?? undefined,
        leader_email: teamData.leader_email ?? undefined,
        leader_name: teamData.leader_name ?? undefined,
        department: teamData.department ?? undefined,
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

  // Handler para abrir el diálogo de edición
  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setShowEditDialog(true);
  };

  // Handler para guardar cambios de edición
  const handleEditTeam = async (teamData: TeamFormData) => {
    if (!selectedTeam) return { success: false, error: 'No hay equipo seleccionado' };
    try {
      const updateData: UpdateTeamData = {
        name: teamData.name,
        team_size: teamData.team_size ?? undefined,
        leader_name: teamData.leader_name ?? undefined,
        leader_email: teamData.leader_email ?? undefined,
        is_active: teamData.is_active ?? undefined,
        department: teamData.department ?? undefined,
      };
      const result = await updateTeam(selectedTeam.id, updateData);
      if (result.success) {
        setShowEditDialog(false);
        setSelectedTeam(null);
        refetch();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar equipo',
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

        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Botón para ver informe general de equipos */}
          {regularTeams.length > 0 && (
            <Button variant="outlined" startIcon={<AssessmentIcon />} onClick={() => setShowTeamsReport(true)} size="large" color="info">
              Informe General
            </Button>
          )}

          {/* Botón para crear evaluación de liderazgo si no existe */}
          {!leadershipTeam && (
            <Button
              variant="outlined"
              startIcon={<StarIcon />}
              onClick={() => setShowLeadershipDialog(true)}
              size="large"
              color="secondary"
            >
              Configurar Liderazgo
            </Button>
          )}

          {/* Botón para agregar equipo regular */}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateDialog(true)} size="large">
            Agregar Equipo
          </Button>
        </Box>
      </Box>

      {/* Tarjeta especial para equipo de liderazgo (si existe) */}
      {leadershipTeam && (
        <Card
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 56, height: 56 }}>
                <StarIcon fontSize="large" />
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  📊 Evaluación de Liderazgo del Proyecto
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Líder del proyecto + Líderes de equipo como evaluadores
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Creado: {new Date(leadershipTeam.created_at).toLocaleDateString('es-ES')}
                </Typography>
              </Box>

              <Button
                variant="contained"
                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
                startIcon={<VisibilityIcon />}
                onClick={() => navigate(`/projects/${projectId}/teams/${leadershipTeam.id}`)}
              >
                Ver Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Lista de equipos usando TeamCard */}
      <Box>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon />
          Equipos del Proyecto ({regularTeams.length})
        </Typography>

        {regularTeams.length === 0 ? (
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
          <>
            <Grid container spacing={3}>
              {regularTeams.map(team => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={team.id}>
                  <TeamCard
                    projectName={currentProject.name}
                    team={team}
                    onView={() => handleTeamClick(team.id)}
                    onDelete={() => handleDeleteTeam(team.id)}
                    onEdit={openEditDialog}
                    showActions={true}
                  />
                </Grid>
              ))}
            </Grid>
            {/* Diálogo para editar equipo */}
            <TeamEditor
              open={showEditDialog}
              team={selectedTeam}
              onClose={() => {
                setShowEditDialog(false);
                setSelectedTeam(null);
              }}
              onSave={handleEditTeam}
            />
          </>
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

      {/* Diálogo para crear equipo de liderazgo */}
      <CreateProjectLeadershipDialog
        open={showLeadershipDialog}
        onClose={() => setShowLeadershipDialog(false)}
        projectName={currentProject?.name || ''}
        projectId={projectId!}
        onSuccess={() => {
          refetch();
          setShowLeadershipDialog(false);
        }}
      />

      {/* Diálogo para informe general de equipos */}
      <ProjectTeamsReport
        open={showTeamsReport}
        onClose={() => setShowTeamsReport(false)}
        teams={projectTeams}
        projectName={currentProject?.name || ''}
      />
    </Container>
  );
}

export default ProjectDetailPage;
