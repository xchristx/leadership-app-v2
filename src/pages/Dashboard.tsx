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
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Work as ProjectsIcon,
  Groups as TeamsIcon,
  Assessment as EvaluationsIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
} from '@mui/icons-material';
import { StatsCard, CustomCard } from '../components';
import { useAuth, useProjects, useTeams, useEvaluations } from '../hooks';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { projects, stats: projectStats, isLoading: projectsLoading } = useProjects();
  const { teams, stats: teamStats, isLoading: teamsLoading } = useTeams();
  const { evaluations, stats: evalStats, isLoading: evaluationsLoading } = useEvaluations();

  // Proyectos recientes (últimos 5, ordenados por fecha de creación)
  const recentProjects = useMemo(() => {
    return [...projects].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
  }, [projects]);

  // Evaluaciones pendientes (últimas 5)
  const pendingEvaluations = useMemo(() => {
    return evaluations
      .filter(e => !e.is_complete)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [evaluations]);

  // Calcular tasa de finalización promedio
  const completionRate = useMemo(() => {
    if (evaluations.length === 0) return 0;
    const completed = evaluations.filter(e => e.is_complete).length;
    return Math.round((completed / evaluations.length) * 100);
  }, [evaluations]);

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  const handleViewAllProjects = () => {
    navigate('/projects');
  };

  const handleViewAllTeams = () => {
    navigate('/teams');
  };

  const handleViewAllEvaluations = () => {
    navigate('/evaluations');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bienvenido, {profile?.first_name} {profile?.last_name}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Métricas principales */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Proyectos Totales"
            value={projectStats.total}
            change={{ value: projectStats.active, label: 'activos' }}
            icon={<ProjectsIcon />}
            loading={projectsLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Equipos"
            value={teamStats.total}
            change={{ value: teamStats.active, label: 'activos' }}
            icon={<TeamsIcon />}
            loading={teamsLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Evaluaciones"
            value={evalStats.total}
            change={{ value: evalStats.active, label: 'pendientes' }}
            icon={<EvaluationsIcon />}
            loading={evaluationsLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Tasa de Finalización"
            value={`${completionRate}%`}
            change={{ value: evalStats.completed, label: 'completadas' }}
            icon={<TrendingUpIcon />}
            loading={evaluationsLoading}
          />
        </Grid>

        {/* Proyectos recientes */}
        <Grid size={{ xs: 12, lg: 8 }}>
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
              <List sx={{ py: 0 }}>
                {recentProjects.map((project, index) => (
                  <Box key={project.id}>
                    <ListItem
                      sx={{
                        px: 0,
                        py: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                        },
                      }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: project.status === 'active' ? 'success.main' : 'grey.400' }}>
                          <ProjectsIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight={600}>
                            {project.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
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
                              sx={{ fontWeight: 600 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(project.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
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
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <ProjectsIcon sx={{ fontSize: 56, mb: 2, opacity: 0.3 }} />
                <Typography variant="body1" fontWeight={500}>
                  No hay proyectos
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Crea tu primer proyecto para empezar
                </Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleCreateProject} sx={{ mt: 2 }}>
                  Crear Proyecto
                </Button>
              </Box>
            )}
          </CustomCard>
        </Grid>

        {/* Evaluaciones pendientes */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <CustomCard
            title="Evaluaciones Pendientes"
            loading={evaluationsLoading}
            headerActions={
              pendingEvaluations.length > 0 && (
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={handleViewAllEvaluations}>
                  Ver todas
                </Button>
              )
            }
          >
            {pendingEvaluations.length > 0 ? (
              <List sx={{ py: 0 }}>
                {pendingEvaluations.map((evaluation, index) => (
                  <Box key={evaluation.id}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <PendingIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600} noWrap>
                            Equipo: {evaluation.team_id || 'Sin asignar'}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Creado:{' '}
                              {new Date(evaluation.created_at).toLocaleDateString('es-ES', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < pendingEvaluations.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <CheckCircleIcon sx={{ fontSize: 56, mb: 2, opacity: 0.3, color: 'success.main' }} />
                <Typography variant="body1" fontWeight={500}>
                  ¡Todo al día!
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  No hay evaluaciones pendientes
                </Typography>
              </Box>
            )}
          </CustomCard>
        </Grid>

        {/* Resumen de equipos */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>
                  Resumen de Equipos
                </Typography>
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={handleViewAllTeams}>
                  Ver todos
                </Button>
              </Box>

              {teamsLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Cargando...
                </Typography>
              ) : teams.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        <TeamsIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        Total de Equipos
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700}>
                      {teamStats.total}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Equipos Activos
                    </Typography>
                    <Chip label={teamStats.active} color="success" size="small" sx={{ fontWeight: 600 }} />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Equipos Inactivos
                    </Typography>
                    <Chip label={teamStats.inactive} color="default" size="small" sx={{ fontWeight: 600 }} />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <TeamsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body2">No hay equipos creados</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Estado de proyectos */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>
                  Estado de Proyectos
                </Typography>
              </Box>

              {projectsLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Cargando...
                </Typography>
              ) : projects.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                      <Typography variant="body2">Activos</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {projectStats.active}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                      <Typography variant="body2">Completados</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {projectStats.completed}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                      <Typography variant="body2">Borradores</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {projectStats.draft}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'grey.400' }} />
                      <Typography variant="body2">Archivados</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {projectStats.archived}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <ProjectsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body2">No hay proyectos</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Gráficos y métricas avanzadas */}
        {/* <Grid size={{ xs: 12 }}>
          <DashboardMetrics />
        </Grid> */}
      </Grid>
    </Box>
  );
}
