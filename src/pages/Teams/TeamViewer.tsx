// ============================================================================
// COMPONENTE TEAM VIEWER
// ============================================================================
// Vista detallada de equipos con estadísticas
// ============================================================================

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import {
  Group as GroupIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Link as LinkIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import type { Team } from '../../types';
import type { TeamStats } from '../../services/teamService';

export interface TeamViewerProps {
  team: Team;
  stats?: TeamStats;
  onEdit?: (team: Team) => void;
  onManageInvitations?: (team: Team) => void;
  onCreateInvitation?: (team: Team) => void;
  isLoading?: boolean;
}

export function TeamViewer({ team, stats, onEdit, onManageInvitations, onCreateInvitation, isLoading = false }: TeamViewerProps) {
  const completionRate = stats?.completion_rate || 0;
  const totalInvitations = team.invitations?.length || 0;
  const activeInvitations = team.invitations?.filter(inv => inv.is_active).length || 0;
  const completedEvaluations = stats?.completed_evaluations || 0;
  const pendingEvaluations = stats?.pending_evaluations || 0;
  return (
    <Box sx={{ p: 3 }}>
      {/* Header con información principal */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {team.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label={team.is_active ? 'Activo' : 'Inactivo'} color={team.is_active ? 'success' : 'default'} />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {onEdit && (
                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => onEdit(team)}>
                  Editar
                </Button>
              )}
              {onCreateInvitation && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => onCreateInvitation(team)}>
                  Nueva Invitación
                </Button>
              )}
              {onManageInvitations && (
                <Button variant="contained" startIcon={<LinkIcon />} onClick={() => onManageInvitations(team)} color="secondary">
                  Gestionar Invitaciones
                </Button>
              )}
            </Box>
          </Box>

          {/* Información del líder */}
          {team.leader_name && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 56, height: 56 }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{team.leader_name}</Typography>
                {team.leader_email && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailIcon fontSize="small" />
                    {team.leader_email}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Líder del equipo
                </Typography>
              </Box>
            </Box>
          )}

          {/* Información básica */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tamaño del equipo
                  </Typography>
                  <Typography variant="h6">{team.team_size || 'No especificado'} miembros</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Proyecto
                  </Typography>
                  <Typography variant="h6">{team.project_id}</Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Creado
                  </Typography>
                  <Typography variant="h6">{new Date(team.created_at).toLocaleDateString()}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Invitaciones Totales
                  </Typography>
                  <Typography variant="h4">{isLoading ? '...' : totalInvitations}</Typography>
                </Box>
                <LinkIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Invitaciones Activas
                  </Typography>
                  <Typography variant="h4">{isLoading ? '...' : activeInvitations}</Typography>
                </Box>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Evaluaciones Completadas
                  </Typography>
                  <Typography variant="h4">{isLoading ? '...' : completedEvaluations}</Typography>
                </Box>
                <GroupIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Evaluaciones Pendientes
                  </Typography>
                  <Typography variant="h4">{isLoading ? '...' : pendingEvaluations}</Typography>
                </Box>
                <AssignmentIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progreso de completitud */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Progreso de Evaluaciones
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress variant="determinate" value={completionRate} sx={{ height: 12, borderRadius: 6 }} />
            </Box>
            <Typography variant="h6" color="primary">
              {completionRate.toFixed(1)}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {completedEvaluations} de {completedEvaluations + pendingEvaluations} evaluaciones completadas
          </Typography>
        </CardContent>
      </Card>

      {/* Invitaciones activas */}
      {team.invitations && team.invitations.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Invitaciones del Equipo
            </Typography>
            <List>
              {team.invitations.slice(0, 5).map(invitation => (
                <ListItem key={invitation.id}>
                  <ListItemAvatar>
                    <Avatar>
                      <LinkIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Invitación ${invitation.role_type === 'leader' ? 'de Líder' : 'de Colaborador'}`}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Usos: {invitation.current_uses || 0} / {invitation.max_uses || '∞'}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Expira: {invitation.expires_at ? new Date(invitation.expires_at).toLocaleDateString() : 'Sin límite'}
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip
                    label={invitation.is_active ? 'Activa' : 'Inactiva'}
                    color={invitation.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
            {team.invitations.length > 5 && (
              <Box sx={{ textAlign: 'center', pt: 1 }}>
                <Button onClick={() => onManageInvitations?.(team)} size="small">
                  Ver todas las invitaciones ({team.invitations.length})
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
