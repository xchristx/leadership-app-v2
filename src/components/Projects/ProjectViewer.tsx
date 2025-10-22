// ============================================================================
// COMPONENTE PROJECT VIEWER
// ============================================================================
// Vista detallada de un proyecto con estadísticas y opciones de gestión
// ============================================================================

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  DateRange as DateRangeIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import type { Project } from '../../types';

export interface ProjectViewerProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onManageTeams?: (project: Project) => void;
  onManageConfiguration?: (project: Project) => void;
  onViewReports?: (project: Project) => void;
  onExportData?: (project: Project) => void;
  loading?: boolean;
}

export function ProjectViewer({
  project,
  onEdit,
  onManageTeams,
  onManageConfiguration,
  onViewReports,
  onExportData,
  loading = false,
}: ProjectViewerProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const completionRate = project._stats?.completion_rate || 0;
  const totalTeams = project._stats?.total_teams || 0;
  const completedEvaluations = project._stats?.completed_evaluations || 0;
  const expectedMembers = project._stats?.expected_members || 0;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid size={{ xs: 12, md: 6 }} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" component="h1">
              {project.name}
            </Typography>
            <Chip label={getStatusLabel(project.status)} color={getStatusColor(project.status)} size="small" />
          </Box>
          {project.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {project.description}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            Creado el {formatDate(project.created_at)}
            {project.template && ` • Plantilla: ${project.template.title}`}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => onEdit?.(project)} size="small">
            Editar
          </Button>
          <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => onManageConfiguration?.(project)} size="small">
            Configurar
          </Button>
          <Button variant="contained" startIcon={<GroupIcon />} onClick={() => onManageTeams?.(project)} size="small">
            Gestionar Equipos
          </Button>
        </Box>
      </Box>

      {/* Estadísticas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <GroupIcon color="primary" />
                <Box>
                  <Typography variant="h4">{totalTeams}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Equipos
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
                <AssignmentIcon color="success" />
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
                <TrendingUpIcon color="info" />
                <Box>
                  <Typography variant="h4">{completionRate.toFixed(1)}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Progreso
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
                <DateRangeIcon color="warning" />
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
      </Grid>

      {/* Barra de progreso general */}
      {project.status === 'active' && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Progreso del Proyecto</Typography>
              <Typography variant="h6" color="primary">
                {completionRate.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={completionRate} sx={{ height: 8, borderRadius: 4 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {completedEvaluations} evaluaciones completadas • {totalTeams} equipos • {expectedMembers} miembros esperados
            </Typography>
          </CardContent>
        </Card>
      )}

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
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText primary="Estado" secondary={getStatusLabel(project.status)} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <DateRangeIcon />
                  </ListItemIcon>
                  <ListItemText primary="Fecha de inicio" secondary={formatDate(project.start_date)} />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <DateRangeIcon />
                  </ListItemIcon>
                  <ListItemText primary="Fecha de finalización" secondary={formatDate(project.end_date)} />
                </ListItem>
                {project.template && (
                  <ListItem>
                    <ListItemIcon>
                      <VisibilityIcon />
                    </ListItemIcon>
                    <ListItemText primary="Plantilla" secondary={project.template.title} />
                  </ListItem>
                )}
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
                <Button disabled variant="outlined" startIcon={<TrendingUpIcon />} onClick={() => onViewReports?.(project)} fullWidth>
                  Ver Reportes
                </Button>
                <Button disabled variant="outlined" startIcon={<DownloadIcon />} onClick={() => onExportData?.(project)} fullWidth>
                  Exportar Datos
                </Button>
                <Button disabled variant="outlined" startIcon={<SettingsIcon />} onClick={() => onManageConfiguration?.(project)} fullWidth>
                  Configuración Avanzada
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas y notificaciones */}
      {project.status === 'draft' && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Este proyecto está en estado borrador. Actívalo para que los equipos puedan comenzar las evaluaciones.
        </Alert>
      )}

      {project.status === 'active' && completionRate < 50 && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          El progreso del proyecto está por debajo del 50%. Considera enviar recordatorios a los participante.
        </Alert>
      )}
    </Box>
  );
}
