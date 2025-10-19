// ============================================================================
// COMPONENTE TEAM CARD
// ============================================================================
// Tarjeta reutilizable para mostrar información de equipos
// ============================================================================

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  LinearProgress,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Link as LinkIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
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

  // Calcular estadísticas del equipo - usar _stats si están disponibles, sino calcular
  const expectedMembers = team.team_size || 0;
  const completedEvaluations =
    team._stats?.completed_evaluations || team.evaluations?.filter(evaluation => evaluation.is_complete).length || 0;
  const actualCompletionRate = team._stats?.completion_rate || (expectedMembers > 0 ? (completedEvaluations / expectedMembers) * 100 : 0);

  // Calcular días desde creación
  const daysSinceCreated = Math.floor((Date.now() - new Date(team.created_at).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onView ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          boxShadow: theme => (theme.palette.mode === 'light' ? '0 8px 24px rgba(0, 0, 0, 0.12)' : '0 8px 24px rgba(0, 0, 0, 0.6)'),
          transform: onView ? 'translateY(-4px)' : 'translateY(-2px)',
        },
        border: theme => `1px solid ${theme.palette.divider}`,
      }}
      onClick={onView ? handleView : undefined}
    >
      <CardContent sx={{ p: 3, pb: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header con avatar y estado */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
            <Avatar
              sx={{
                bgcolor: team.is_active ? 'success.main' : 'grey.400',
                width: 40,
                height: 40,
                fontSize: '1.2rem',
                fontWeight: 'bold',
              }}
            >
              {team.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, lineHeight: 1.3, mb: 0.5 }}>
                {team.name}
              </Typography>
              <Badge
                badgeContent={completedEvaluations}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    right: -3,
                    top: 3,
                  },
                }}
              >
                <Chip
                  label={team.is_active ? 'Activo' : 'Inactivo'}
                  color={team.is_active ? 'success' : 'default'}
                  size="small"
                  sx={{ fontWeight: 'medium', minWidth: 70 }}
                />
              </Badge>
            </Box>
          </Box>

          {showActions && (
            <Tooltip title="Más opciones">
              <IconButton
                onClick={handleMenuClick}
                size="small"
                sx={{
                  opacity: 0.7,
                  '&:hover': { opacity: 1, bgcolor: 'action.hover' },
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Estadísticas del equipo */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Tooltip title="Miembros esperados del equipo">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24 }}>
                <GroupIcon sx={{ fontSize: 14 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 600, fontSize: '1rem' }}>
                  {expectedMembers}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Miembros
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
                <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 600, fontSize: '1rem' }}>
                  {completedEvaluations}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completadas
                </Typography>
              </Box>
            </Box>
          </Tooltip>

          <Tooltip title="Progreso del equipo">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 24, height: 24 }}>
                <TrendingUpIcon sx={{ fontSize: 14 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 600, fontSize: '1rem' }}>
                  {actualCompletionRate.toFixed(0)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Progreso
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        </Box>

        {/* Progreso de evaluaciones mejorado */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Progreso del equipo ({completedEvaluations} de {expectedMembers})
            </Typography>
            <Chip
              label={`${((completedEvaluations / expectedMembers) * 100 || 0).toFixed(1)}%`}
              size="small"
              color={actualCompletionRate > 75 ? 'success' : actualCompletionRate > 50 ? 'warning' : 'default'}
              sx={{ minWidth: 50, height: 20, fontSize: '0.65rem' }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={(completedEvaluations / expectedMembers) * 100 || 0}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: actualCompletionRate > 75 ? 'success.main' : actualCompletionRate > 50 ? 'warning.main' : 'primary.main',
              },
            }}
          />
        </Box>

        {/* Información adicional */}
        <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Hace {daysSinceCreated} días
              </Typography>
            </Box>

            <Tooltip title={`ID del Proyecto: ${team.project_id}`}>
              <Chip icon={<AssignmentIcon />} label="Proyecto" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
            </Tooltip>
          </Box>
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
