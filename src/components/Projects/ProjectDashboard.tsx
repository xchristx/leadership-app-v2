// ============================================================================
// COMPONENTE PROJECT DASHBOARD
// ============================================================================
// Dashboard completo con métricas, visualizaciones y gestión de proyectos
// ============================================================================

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Skeleton,
  Tab,
  Tabs,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useProject, useProjects } from '../../hooks';
import type { Project } from '../../types';

export interface ProjectDashboardProps {
  projectId: string;
  onEditProject?: (project: Project) => void;
  onManageTeams?: (project: Project) => void;
  onExportData?: (project: Project) => void;
  onSendReminders?: (project: Project) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`dashboard-tabpanel-${index}`} aria-labelledby={`dashboard-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function ProjectDashboard({ projectId, onEditProject, onManageTeams, onExportData, onSendReminders }: ProjectDashboardProps) {
  const [currentTab, setCurrentTab] = useState(0);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const { project, stats, isLoading, loadStats, getDashboard } = useProject(projectId);

  const { exportProjectData } = useProjects();

  // Cargar datos del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoadingDashboard(true);
      try {
        await Promise.all([loadStats(), getDashboard()]);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    if (projectId) {
      loadDashboardData();
    }
  }, [projectId, loadStats, getDashboard]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleExport = async () => {
    if (!project) return;

    try {
      const data = await exportProjectData(projectId);
      // Crear y descargar archivo
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proyecto-${project.name}-datos.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onExportData?.(project);
    } catch (error) {
      console.error('Error al exportar datos:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'draft':
        return 'default';
      case 'archived':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'completed':
        return 'Completado';
      case 'draft':
        return 'Borrador';
      case 'archived':
        return 'Archivado';
      default:
        return status;
    }
  };

  if (isLoading || !project) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const completionRate = stats?.completion_rate || 0;
  const totalTeams = stats?.total_teams || 0;
  const completedEvaluations = stats?.completed_evaluations || 0;
  const expectedMembers = stats?.expected_members || 0;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4">{project.name}</Typography>
            <Chip label={getStatusLabel(project.status)} color={getStatusColor(project.status)} size="small" />
          </Box>
          {project.description && (
            <Typography variant="body1" color="text.secondary">
              {project.description}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => loadStats()} disabled={isLoadingDashboard} size="small">
            <RefreshIcon />
          </IconButton>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} size="small">
            Exportar
          </Button>
          <Button variant="outlined" startIcon={<GroupIcon />} onClick={() => onManageTeams?.(project)} size="small">
            Gestionar Equipos
          </Button>
        </Box>
      </Box>

      {/* Métricas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <GroupIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h4">{totalTeams}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Equipos Registrados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AssignmentIcon color="info" fontSize="large" />
                <Box>
                  <Typography variant="h4">{expectedMembers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Miembros Esperados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4">{completedEvaluations}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Evaluaciones Completadas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon color="warning" fontSize="large" />
                <Box>
                  <Typography variant="h4">{completionRate.toFixed(1)}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Progreso Total
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Barra de progreso */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Progreso del Proyecto</Typography>
            <Typography variant="h6" color="primary">
              {completedEvaluations} / {expectedMembers} evaluaciones
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={completionRate} sx={{ height: 8, borderRadius: 4, mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {completionRate.toFixed(1)}% completado
          </Typography>
        </CardContent>
      </Card>

      {/* Alertas */}
      {project.status === 'draft' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Este proyecto está en estado borrador. Actívalo para comenzar las evaluaciones.
        </Alert>
      )}

      {project.status === 'active' && completionRate < 30 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          El progreso está por debajo del 30%. Considera enviar recordatorios.
          <Button size="small" onClick={() => onSendReminders?.(project)} sx={{ ml: 2 }}>
            Enviar Recordatorios
          </Button>
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Resumen" />
          <Tab label="Equipos" />
          <Tab label="Actividad" />
          <Tab label="Configuración" />
        </Tabs>
      </Box>

      {/* Contenido de tabs */}
      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          {/* Información del proyecto */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información del Proyecto
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon />
                    </ListItemIcon>
                    <ListItemText primary="Fecha de inicio" secondary={formatDate(project.start_date)} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon />
                    </ListItemIcon>
                    <ListItemText primary="Fecha de finalización" secondary={formatDate(project.end_date)} />
                  </ListItem>
                  {project.template && (
                    <ListItem>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText primary="Plantilla" secondary={project.template.title} />
                    </ListItem>
                  )}
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon />
                    </ListItemIcon>
                    <ListItemText primary="Niveles de jerarquía" secondary={`${project.hierarchy_levels} niveles`} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Acciones rápidas */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Acciones Rápidas
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button variant="outlined" startIcon={<GroupIcon />} onClick={() => onManageTeams?.(project)} fullWidth>
                    Gestionar Equipos ({totalTeams})
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EmailIcon />}
                    onClick={() => onSendReminders?.(project)}
                    fullWidth
                    disabled={project.status !== 'active'}
                  >
                    Enviar Recordatorios
                  </Button>
                  <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} fullWidth>
                    Exportar Datos
                  </Button>
                  <Button variant="outlined" startIcon={<TimelineIcon />} fullWidth>
                    Ver Reportes Detallados
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Equipos del Proyecto
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Gestiona los equipos y sus invitaciones de evaluación
            </Typography>

            {totalTeams === 0 ? (
              <Alert severity="info">
                No hay equipos registrados en este proyecto.
                <Button size="small" onClick={() => onManageTeams?.(project)} sx={{ ml: 2 }}>
                  Crear Primer Equipo
                </Button>
              </Alert>
            ) : (
              <Box>
                <Button variant="contained" startIcon={<GroupIcon />} onClick={() => onManageTeams?.(project)} sx={{ mb: 3 }}>
                  Gestionar Equipos
                </Button>

                <Typography variant="body2" color="text.secondary">
                  {totalTeams} equipos registrados • {completedEvaluations} de {expectedMembers} evaluaciones completadas
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={currentTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Actividad Reciente
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Histórico de evaluaciones y actividades del proyecto
            </Typography>

            <Alert severity="info" sx={{ mt: 3 }}>
              Esta funcionalidad estará disponible próximamente
            </Alert>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={currentTab} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Configuración del Proyecto
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ajustes avanzados y configuraciones
            </Typography>

            <Button variant="outlined" onClick={() => onEditProject?.(project)}>
              Editar Configuración
            </Button>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
}
