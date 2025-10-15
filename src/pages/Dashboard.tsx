// ============================================================================
// PÁGINA DASHBOARD
// ============================================================================
// Dashboard principal con métricas, resumen de proyectos y actividad reciente
// ============================================================================

import {
  Box,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  IconButton,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Work as ProjectsIcon,
  Groups as TeamsIcon,
  Assessment as EvaluationsIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { StatsCard, CustomCard, DashboardMetrics } from '../components';
import { useAuth, useProjects, useTeams, useEvaluations } from '../hooks';

export function Dashboard() {
  const { profile } = useAuth();
  const { projects, stats: projectStats, isLoading: projectsLoading } = useProjects();
  const { stats: teamStats, isLoading: teamsLoading } = useTeams();
  const { evaluations, stats: evalStats, isLoading: evaluationsLoading } = useEvaluations();

  // Proyectos recientes (últimos 5)
  const recentProjects = projects.slice(0, 5);

  // Evaluaciones pendientes
  const pendingEvaluations = evaluations.filter(e => !e.is_complete).slice(0, 3);

  const handleCreateProject = () => {
    // TODO: Implementar navegación a crear proyecto
    console.log('Navigate to create project');
  };

  const handleViewAllProjects = () => {
    // TODO: Implementar navegación a lista de proyectos
    console.log('Navigate to projects list');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bienvenido, {profile?.first_name} {profile?.last_name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton>
            <RefreshIcon />
          </IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateProject}>
            Nuevo Proyecto
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Métricas principales */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Proyectos Activos"
            value={projectStats.active}
            change={{ value: 12, label: 'vs mes anterior' }}
            icon={<ProjectsIcon />}
            loading={projectsLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Equipos"
            value={teamStats.total}
            change={{ value: 8, label: 'nuevos este mes' }}
            icon={<TeamsIcon />}
            loading={teamsLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Evaluaciones"
            value={evalStats.active}
            change={{ value: -5, label: 'pendientes' }}
            icon={<EvaluationsIcon />}
            loading={evaluationsLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Rendimiento"
            value="87%"
            change={{ value: 15, label: 'mejora promedio' }}
            icon={<TrendingUpIcon />}
            loading={false}
          />
        </Grid>

        {/* Proyectos recientes */}
        <Grid size={{ xs: 12, md: 8 }}>
          <CustomCard
            title="Proyectos Recientes"
            headerActions={
              <Button size="small" endIcon={<ArrowForwardIcon />} onClick={handleViewAllProjects}>
                Ver todos
              </Button>
            }
            loading={projectsLoading}
          >
            {recentProjects.length > 0 ? (
              <List>
                {recentProjects.map((project, index) => (
                  <Box key={project.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar>
                          <ProjectsIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={project.name}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={
                                project.status === 'active'
                                  ? 'Activo'
                                  : project.status === 'completed'
                                  ? 'Completado'
                                  : project.status === 'draft'
                                  ? 'Borrador'
                                  : 'Archivado'
                              }
                              size="small"
                              color={project.status === 'active' ? 'success' : project.status === 'completed' ? 'primary' : 'default'}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(project.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentProjects.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <ProjectsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">No hay proyectos recientes</Typography>
              </Box>
            )}
          </CustomCard>
        </Grid>

        {/* Evaluaciones pendientes */}
        <Grid size={{ xs: 12, md: 4 }}>
          <CustomCard title="Evaluaciones Pendientes" loading={evaluationsLoading}>
            {pendingEvaluations.length > 0 ? (
              <List>
                {pendingEvaluations.map((evaluation, index) => (
                  <Box key={evaluation.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <EvaluationsIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap>
                            {evaluation.team?.name || 'Proyecto'} {/* TODO: Mostrar nombre del proyecto */}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            Creado: {evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() : 'Sin fecha'}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < pendingEvaluations.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <EvaluationsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">No hay evaluaciones pendientes</Typography>
              </Box>
            )}
          </CustomCard>
        </Grid>

        {/* Gráficos y métricas avanzadas */}
        <Grid size={{ xs: 12 }}>
          <DashboardMetrics />
        </Grid>
      </Grid>
    </Box>
  );
}
