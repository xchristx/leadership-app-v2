// ============================================================================
// COMPONENTE PROJECT CARD
// ============================================================================
// Tarjeta para mostrar información de un proyecto con acciones
// ============================================================================

import { Card, CardContent, CardActions, Typography, Chip, Button, Box, IconButton, Menu, MenuItem, LinearProgress } from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  DateRange as DateRangeIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import type { Project } from '../../types';

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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const formatDate = (dateString: string) => {
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

  const completionRate = project._stats?.completion_rate || 0;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: loading ? 0.7 : 1,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
      }}
    >
      {loading && <LinearProgress />}

      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header con estado y menú */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Chip label={getStatusLabel(project.status)} color={getStatusColor(project.status)} size="small" />
          <IconButton size="small" onClick={handleMenuOpen} disabled={loading}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Información principal */}
        <Typography variant="h6" gutterBottom noWrap>
          {project.name}
        </Typography>

        {project.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.description}
          </Typography>
        )}

        {/* Estadísticas */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GroupIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {project._stats?.total_teams || 0} equipos
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AssignmentIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {project._stats?.completed_evaluations || 0} evaluaciones
            </Typography>
          </Box>
        </Box>

        {/* Progress bar de completitud */}
        {project.status === 'active' && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progreso
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {completionRate.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={completionRate} sx={{ height: 6, borderRadius: 3 }} />
          </Box>
        )}

        {/* Fechas */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <DateRangeIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Creado: {formatDate(project.created_at)}
          </Typography>
        </Box>

        {project.template && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Plantilla: {project.template.title}
          </Typography>
        )}
      </CardContent>

      {/* Acciones principales */}
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button size="small" startIcon={<VisibilityIcon />} onClick={() => onView?.(project)} disabled={loading}>
          Ver
        </Button>
        <Button size="small" startIcon={<GroupIcon />} onClick={() => onManageTeams?.(project)} disabled={loading}>
          Equipos
        </Button>
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
    </Card>
  );
}
