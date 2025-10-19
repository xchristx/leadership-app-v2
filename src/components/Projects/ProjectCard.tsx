// ============================================================================
// COMPONENTE PROJECT CARD
// ============================================================================
// Tarjeta mejorada para mostrar información de un proyecto con acciones avanzadas
// ============================================================================

import {
  Card,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Avatar,
  Tooltip,
  Divider,
  Badge,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import type { Project } from '../../types';
import { ProjectViewer } from './ProjectViewer';

export interface ProjectCardProps {
  project: Project;
  onView?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onManageTeams?: (project: Project) => void;
  loading?: boolean;
}

export function ProjectCard({ project, onView, onEdit, onDelete, onManageTeams, loading = false }: ProjectCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
  const totalEvaluations = project._stats?.completed_evaluations || 0;

  // Calcular días desde creación
  const daysSinceCreated = Math.floor((Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: loading ? 0.7 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'visible',
        '&:hover': {
          boxShadow: theme => (theme.palette.mode === 'light' ? '0 12px 32px rgba(0, 0, 0, 0.15)' : '0 12px 32px rgba(0, 0, 0, 0.7)'),
          transform: 'translateY(-4px)',
          '& .project-actions': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        border: theme => `1px solid ${theme.palette.divider}`,
      }}
    >
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />}

      {/* Header con avatar y estado */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: `${getStatusColor(project.status)}.main`,
                width: 40,
                height: 40,
                fontSize: '1.2rem',
                fontWeight: 'bold',
              }}
            >
              {project.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Badge
                badgeContent={totalTeams}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    right: -3,
                    top: 3,
                  },
                }}
              >
                <Chip
                  label={getStatusLabel(project.status)}
                  color={getStatusColor(project.status)}
                  size="small"
                  sx={{
                    fontWeight: 'medium',
                    minWidth: 80,
                  }}
                />
              </Badge>
            </Box>
          </Box>

          <Tooltip title="Más opciones">
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              disabled={loading}
              sx={{
                opacity: 0.7,
                '&:hover': { opacity: 1, bgcolor: 'action.hover' },
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Título del proyecto */}
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            fontWeight: 600,
            lineHeight: 1.3,
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {project.name}
        </Typography>

        {/* Descripción */}
        {project.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
            }}
          >
            {project.description}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Estadísticas mejoradas */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Tooltip title="Equipos del proyecto">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24 }}>
                <GroupIcon sx={{ fontSize: 14 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 600 }}>
                  {totalTeams}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Equipos
                </Typography>
              </Box>
            </Box>
          </Tooltip>

          <Tooltip title="Evaluaciones completadas">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 24, height: 24 }}>
                <AssignmentIcon sx={{ fontSize: 14 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 600 }}>
                  {totalEvaluations}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Evaluaciones
                </Typography>
              </Box>
            </Box>
          </Tooltip>

          <Tooltip title="Progreso general">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 24, height: 24 }}>
                <TrendingUpIcon sx={{ fontSize: 14 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 600 }}>
                  {completionRate.toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Progreso
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        </Box>

        {/* Progress bar visual mejorado */}
        {project.status === 'active' && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Progreso del proyecto ({totalEvaluations} evaluaciones completadas)
              </Typography>
              <Chip
                label={`${completionRate.toFixed(1)}%`}
                size="small"
                color={completionRate > 75 ? 'success' : completionRate > 50 ? 'warning' : 'default'}
                sx={{ minWidth: 50, height: 20, fontSize: '0.65rem' }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionRate}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor: completionRate > 75 ? 'success.main' : completionRate > 50 ? 'warning.main' : 'primary.main',
                },
              }}
            />
          </Box>
        )}

        {/* Información temporal */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Hace {daysSinceCreated} días
            </Typography>
          </Box>

          {project.template && (
            <Tooltip title={`Plantilla: ${project.template.title}`}>
              <Chip icon={<StarIcon />} label="Plantilla" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Acciones principales mejoradas */}
      <CardActions
        className="project-actions"
        sx={{
          p: 2,
          pt: 0,
          gap: 1,
          opacity: 0.8,
          transform: 'translateY(2px)',
          transition: 'all 0.2s ease',
        }}
      >
        <Tooltip title="Ver detalles del proyecto">
          <Button
            variant="contained"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => setViewerOpen(true)}
            disabled={loading}
            sx={{ flex: 1 }}
          >
            Ver Proyecto
          </Button>
        </Tooltip>

        <Tooltip title="Gestionar equipos">
          <Button
            variant="outlined"
            size="small"
            startIcon={<GroupIcon />}
            onClick={() => onManageTeams?.(project)}
            disabled={loading}
            sx={{ flex: 1 }}
          >
            Equipos
          </Button>
        </Tooltip>
      </CardActions>

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            onView?.(project);
            handleMenuClose();
          }}
          sx={{ display: 'none' }}
        >
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Ver detalles
        </MenuItem>
        <MenuItem
          onClick={() => {
            onEdit?.(project);
            handleMenuClose();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem
          onClick={() => {
            onManageTeams?.(project);
            handleMenuClose();
          }}
          sx={{ display: 'none' }}
        >
          <GroupIcon fontSize="small" sx={{ mr: 1 }} />
          Gestionar equipos
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete?.(project.id);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Diálogo de vista detallada del proyecto */}
      <Dialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <ProjectViewer
            project={project}
            onEdit={project => {
              setViewerOpen(false);
              onEdit?.(project);
            }}
            onManageTeams={project => {
              setViewerOpen(false);
              onManageTeams?.(project);
            }}
            onManageConfiguration={() => {
              console.log('Manage configuration for project:', project.id);
            }}
            onViewReports={() => {
              console.log('View reports for project:', project.id);
            }}
            onExportData={() => {
              console.log('Export data for project:', project.id);
            }}
            loading={loading}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewerOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
