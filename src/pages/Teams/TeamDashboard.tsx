// ============================================================================
// COMPONENTE TEAM DASHBOARD
// ============================================================================
// Dashboard avanzado para equipos con métricas y gestión completa
// ============================================================================

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Link as LinkIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Edit,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';

import { useTeam } from '../../hooks/useTeams';
import { TeamEditor } from './TeamEditor';
import { TeamInvitations } from './TeamInvitations';
import type { Team } from '../../types';

export interface TeamDashboardProps {
  teamId: string;
  onUpdateTeam?: (team: Team) => void;
  onDeleteTeam?: (teamId: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`team-tabpanel-${index}`} aria-labelledby={`team-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function TeamDashboard({ teamId }: TeamDashboardProps) {
  const [tabValue, setTabValue] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInvitationsDialog, setShowInvitationsDialog] = useState(false);

  const { team, stats, dashboard, isLoading, isError, error, loadStats, loadDashboard, refetch } = useTeam(teamId);

  // Cargar datos al montar
  useEffect(() => {
    if (teamId) {
      loadStats();
      loadDashboard();
    }
  }, [teamId, loadStats, loadDashboard]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    refetch();
    loadStats();
    loadDashboard();
  };

  const handleEditTeam = async (teamData: Record<string, unknown>) => {
    try {
      // Aquí implementarías la lógica de actualización
      console.log('Update team:', teamData);
      setShowEditDialog(false);
      handleRefresh();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar equipo',
      };
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando dashboard del equipo...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (isError || !team) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error al cargar el equipo: {error?.message || 'Equipo no encontrado'}</Alert>
      </Box>
    );
  }

  const completionRate = stats?.completion_rate || 0;
  const totalMembers = stats?.total_members || 0;
  const completedEvaluations = stats?.completed_evaluations || 0;
  const pendingEvaluations = stats?.pending_evaluations || 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header del dashboard */}
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
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
            Actualizar
          </Button>
          <Button variant="outlined" startIcon={<Edit />} onClick={() => setShowEditDialog(true)}>
            Editar
          </Button>
          <Button variant="contained" startIcon={<LinkIcon />} onClick={() => setShowInvitationsDialog(true)}>
            Invitaciones
          </Button>
        </Box>
      </Box>

      {/* Métricas principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Miembros del Equipo
                  </Typography>
                  <Typography variant="h4">{team.team_size || 0}</Typography>
                </Box>
                <GroupIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total de Miembros
                  </Typography>
                  <Typography variant="h4">{totalMembers}</Typography>
                </Box>
                <GroupIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Evaluaciones Completadas
                  </Typography>
                  <Typography variant="h4">{completedEvaluations}</Typography>
                </Box>
                <AssessmentIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Progreso
                  </Typography>
                  <Typography variant="h4">{completionRate.toFixed(1)}%</Typography>
                </Box>
                <TrendingUpIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs de contenido */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Resumen" icon={<DashboardIcon />} iconPosition="start" />
            <Tab label="Invitaciones" icon={<LinkIcon />} iconPosition="start" />
            <Tab label="Evaluaciones" icon={<AssessmentIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Panel de Resumen */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Progreso de evaluaciones */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Progreso de Evaluaciones
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Completadas: {completedEvaluations}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pendientes: {pendingEvaluations}
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={completionRate} sx={{ height: 12, borderRadius: 6 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {completionRate.toFixed(1)}% completado
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Panel de Invitaciones */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Gestión de Invitaciones</Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Crea invitaciones con tokens únicos y seguros. Cada invitación puede tener límites de uso y fechas de expiración.
            </Alert>

            {team.invitations && team.invitations.length > 0 ? (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Invitaciones activas: {team.invitations.filter(inv => inv.is_active).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de invitaciones: {team.invitations.length}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay invitaciones creadas. Usa el botón "Invitaciones" para crear nuevas invitaciones.
              </Typography>
            )}

            <Button variant="contained" startIcon={<LinkIcon />} onClick={() => setShowInvitationsDialog(true)}>
              Gestionar Invitaciones
            </Button>
          </Box>
        </TabPanel>

        {/* Panel de Evaluaciones */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Evaluaciones del Equipo
          </Typography>

          {dashboard?.recent_evaluations && dashboard.recent_evaluations.length > 0 ? (
            <List>
              {dashboard.recent_evaluations.map(evaluation => (
                <ListItem key={evaluation.id} divider>
                  <ListItemText
                    primary={evaluation.evaluator_name || 'Evaluación anónima'}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Rol: {evaluation.evaluator_role}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Progreso: {evaluation.completion_percentage}%
                        </Typography>
                        <Typography variant="caption" display="block">
                          Fecha: {new Date(evaluation.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <LinearProgress variant="determinate" value={evaluation.completion_percentage || 0} sx={{ width: 100, mr: 2 }} />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">No hay evaluaciones registradas para este equipo.</Alert>
          )}
        </TabPanel>
      </Card>

      {/* Diálogo de edición */}
      <TeamEditor open={showEditDialog} team={team} onClose={() => setShowEditDialog(false)} onSave={handleEditTeam} />

      {/* Diálogo de invitaciones */}
      {showInvitationsDialog && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 1300 }}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'background.paper',
              borderRadius: 2,
              width: '90%',
              maxWidth: 800,
              maxHeight: '90%',
              overflow: 'auto',
            }}
          >
            <TeamInvitations teamId={teamId} team={team} onClose={() => setShowInvitationsDialog(false)} />
          </Box>
        </Box>
      )}
    </Box>
  );
}
