// ============================================================================
// COMPONENTE TEAM CARD
// ============================================================================
// Tarjeta reutilizable para mostrar información de equipos
// ============================================================================

import { Card, CardContent, Typography, Box, Chip, IconButton, Menu, MenuItem, Avatar, LinearProgress } from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Link as LinkIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import type { Team } from '../../types';

export interface TeamCardProps {
  team: Team;
  onEdit?: (team: Team) => void;
  onDelete?: (teamId: string) => void;
  onView?: (team: Team) => void;
  onManageInvitations?: (team: Team) => void;
  showActions?: boolean;
}

export function TeamCard({ team, onEdit, onDelete, onView, onManageInvitations, showActions = true }: TeamCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onEdit?.(team);
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onDelete?.(team.id);
  };

  const handleView = () => {
    onView?.(team);
  };

  const handleManageInvitations = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onManageInvitations?.(team);
  };

  // Calcular estadísticas del equipo
  // Calcular el completion rate basado en invitaciones y evaluaciones
  const completionRate = (() => {
    const totalInvitations = team.invitations?.length || 0;
    const completedEvaluations = team.evaluations?.filter(evaluation => evaluation.is_complete).length || 0;

    if (totalInvitations === 0) return 0;
    return Math.round((completedEvaluations / totalInvitations) * 100);
  })();

  return (
    <Card
      sx={{
        cursor: onView ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 2,
          transform: onView ? 'translateY(-2px)' : 'none',
        },
        position: 'relative',
      }}
      onClick={onView ? handleView : undefined}
    >
      <CardContent>
        {/* Header con título y acciones */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              {team.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip label={team.is_active ? 'Activo' : 'Inactivo'} color={team.is_active ? 'success' : 'default'} size="small" />
            </Box>
          </Box>

          {showActions && (
            <IconButton
              onClick={handleMenuClick}
              size="small"
              sx={{
                opacity: 0.7,
                '&:hover': { opacity: 1 },
              }}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>

        {/* Información del equipo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            <GroupIcon />
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {team.team_size || 'Sin especificar'} miembros
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tamaño del equipo
            </Typography>
          </Box>
        </Box>

        {/* Estadísticas */}
        {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <GroupIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {team.team_size} miembros
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LinkIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {invitationsCount} invitaciones
            </Typography>
          </Box>
        </Box> */}

        {/* Progreso de evaluaciones */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progreso de evaluaciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completionRate}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={completionRate} sx={{ height: 6, borderRadius: 3 }} />
        </Box>

        {/* Información del proyecto */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              ID del Proyecto: {team.project_id}
            </Typography>
          </Box>
        </Box>

        {/* Fechas */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Creado: {new Date(team.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>

      {/* Menú de acciones */}
      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose} onClick={e => e.stopPropagation()}>
        {onView && (
          <MenuItem onClick={handleView}>
            <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
            Ver detalles
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Editar equipo
          </MenuItem>
        )}
        {onManageInvitations && (
          <MenuItem onClick={handleManageInvitations}>
            <LinkIcon fontSize="small" sx={{ mr: 1 }} />
            Gestionar invitaciones
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Eliminar equipo
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}
