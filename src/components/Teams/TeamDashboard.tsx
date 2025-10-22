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
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
  Avatar,
  ListItemAvatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Link as LinkIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Edit,
  Visibility as VisibilityIcon,
  PlayArrow as PlayArrowIcon,
  Close as CloseIcon,
  Timeline as TimelineIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';

import { useTeam } from '../../hooks/useTeams';
import { TeamEditor } from './TeamEditor';
import { TeamInvitations } from './TeamInvitations';
import { ComparativeAnalysisDialog } from './ComparativeAnalysisDialog';
import { EvaluationViewer } from '..';
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
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [evaluationViewerOpen, setEvaluationViewerOpen] = useState(false);
  const [showComparativeDialog, setShowComparativeDialog] = useState(false);

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

  const handleViewEvaluation = (evaluationId: string, isComplete: boolean) => {
    if (isComplete) {
      setSelectedEvaluationId(evaluationId);
      setEvaluationViewerOpen(true);
    } else {
      // TODO: Navegar a continuar evaluación
      console.log('Continue evaluation:', evaluationId);
    }
  };

  const handleCloseEvaluationViewer = () => {
    setEvaluationViewerOpen(false);
    setSelectedEvaluationId(null);
  };

  // Determinar si es equipo de liderazgo de proyecto
  const isLeadershipTeam = team?.team_type === 'project_leadership';

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

  const totalMembers = stats?.total_members || 0;
  const completedEvaluations = stats?.completed_evaluations || 0;

  // Calcular progreso basado en miembros esperados del equipo
  const expectedMembers = team.team_size || 0;
  const actualCompletionRate = expectedMembers > 0 ? (completedEvaluations / expectedMembers) * 100 : 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Distintivo de equipo de liderazgo de proyecto */}
      {isLeadershipTeam && (
        <Card
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 56, height: 56 }}>
                <StarIcon fontSize="large" />
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  📊 Evaluación de Liderazgo del Proyecto
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Líder del proyecto + Líderes de equipo como evaluadores
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Creado: {new Date(team.created_at).toLocaleDateString('es-ES')}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Header del dashboard */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {team.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip label={team.is_active ? 'Activo' : 'Inactivo'} color={team.is_active ? 'success' : 'default'} />
            {isLeadershipTeam && (
              <Chip
                label="Liderazgo de Proyecto"
                color="warning"
                icon={<StarIcon sx={{ color: '#ffd700' }} />}
                sx={{ fontWeight: 700, bgcolor: '#fffbe6', color: '#7c4700' }}
              />
            )}
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
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total miembros esperados
                  </Typography>
                  <Typography variant="h6">{team.team_size || 0}</Typography>
                </Box>
                <GroupIcon color="primary" sx={{ fontSize: 24 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Miembros Registrados
                  </Typography>
                  <Typography variant="h6">{totalMembers}</Typography>
                </Box>
                <GroupIcon color="success" sx={{ fontSize: 24 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Evaluaciones Completadas
                  </Typography>
                  <Typography variant="h6">{completedEvaluations}</Typography>
                </Box>
                <AssessmentIcon color="info" sx={{ fontSize: 24 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Progreso
                  </Typography>
                  <Typography variant="h6">{actualCompletionRate.toFixed(1)}%</Typography>
                </Box>
                <TrendingUpIcon color="warning" sx={{ fontSize: 24 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs de contenido */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Resumen" icon={<DashboardIcon />} iconPosition="start" />
              <Tab label="Invitaciones" icon={<LinkIcon />} iconPosition="start" />
              <Tab label="Evaluaciones" icon={<AssessmentIcon />} iconPosition="start" />
            </Tabs>

            <Button variant="outlined" startIcon={<TimelineIcon />} onClick={() => setShowComparativeDialog(true)} sx={{ mr: 1 }}>
              Análisis Comparativo
            </Button>
          </Box>
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
                        Esperadas: {expectedMembers}
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={actualCompletionRate} sx={{ height: 12, borderRadius: 6 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {actualCompletionRate.toFixed(1)}% completado
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Miembros Registrados */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Miembros Registrados
                  </Typography>
                  {dashboard?.recent_evaluations && dashboard.recent_evaluations.length > 0 ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {totalMembers} miembro{totalMembers !== 1 ? 's' : ''} registrado{totalMembers !== 1 ? 's' : ''}
                      </Typography>
                      <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {Array.from(
                          new Map(
                            dashboard.recent_evaluations.map(evaluation => [evaluation.evaluator_name || evaluation.id, evaluation])
                          ).values()
                        ).map(evaluation => (
                          <ListItem key={evaluation.id} sx={{ py: 0.5 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                                {(evaluation.evaluator_name || 'A').charAt(0).toUpperCase()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={<Typography variant="body2">{evaluation.evaluator_name || 'Evaluador anónimo'}</Typography>}
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {evaluation.evaluator_role === 'leader' ? 'Líder' : 'Colaborador'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                    • Evaluación #{evaluation.id.slice(0, 8)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  ) : (
                    <Alert severity="info">
                      <Typography variant="body2">No hay miembros registrados aún.</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Los miembros aparecerán aquí cuando empiecen a completar evaluaciones a través de las invitaciones.
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Información del Equipo */}
            <Grid size={{ xs: 12 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Información del Equipo
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tamaño del Equipo
                      </Typography>
                      <Typography variant="h6">{team.team_size || 'No especificado'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Líder del Equipo
                      </Typography>
                      <Typography variant="body1">{team.leader_name || 'No asignado'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Estado
                      </Typography>
                      <Chip label={team.is_active ? 'Activo' : 'Inactivo'} color={team.is_active ? 'success' : 'default'} size="small" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de Creación
                      </Typography>
                      <Typography variant="body2">{new Date(team.created_at).toLocaleDateString('es-ES')}</Typography>
                    </Grid>
                  </Grid>
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
            {teamId ? (
              <TeamInvitations teamId={teamId} team={team} onClose={() => setShowInvitationsDialog(false)} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay invitaciones creadas. Usa el botón "Invitaciones" para crear nuevas invitaciones.
              </Typography>
            )}

            {/* <Button variant="contained" startIcon={<LinkIcon />} onClick={() => setShowInvitationsDialog(true)}>
              Gestionar Invitaciones
            </Button> */}
          </Box>
        </TabPanel>

        {/* Panel de Evaluaciones */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Evaluaciones del Equipo</Typography>
            <Chip label={`${dashboard?.recent_evaluations?.length || 0} evaluaciones`} color="primary" variant="outlined" />
          </Box>

          {dashboard?.recent_evaluations && dashboard.recent_evaluations.length > 0 ? (
            <List>
              {dashboard.recent_evaluations.map(evaluation => {
                const completionPercentage = evaluation.completion_percentage || 0;
                const isComplete = completionPercentage >= 100;

                return (
                  <ListItem key={evaluation.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {evaluation.evaluator_name || 'Evaluación anónima'}
                          </Typography>
                          <Chip label={isComplete ? 'Completa' : 'En progreso'} color={isComplete ? 'success' : 'warning'} size="small" />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" display="block" color="text.secondary">
                                <strong>ID:</strong> #{evaluation.id.slice(0, 8)}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                <strong>Rol:</strong> {evaluation.evaluator_role === 'leader' ? 'Líder' : 'Colaborador'}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" display="block" color="text.secondary">
                                <strong>Progreso:</strong> {completionPercentage}%
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                <strong>Creada:</strong> {new Date(evaluation.created_at).toLocaleDateString('es-ES')}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={completionPercentage}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: 'grey.200',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 4,
                                    backgroundColor: isComplete ? 'success.main' : 'warning.main',
                                  },
                                }}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 45 }}>
                              {completionPercentage}%
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title={isComplete ? 'Ver evaluación completa' : 'Continuar evaluación'}>
                          <IconButton
                            size="small"
                            color={isComplete ? 'primary' : 'warning'}
                            onClick={() => handleViewEvaluation(evaluation.id, isComplete)}
                          >
                            {isComplete ? <VisibilityIcon /> : <PlayArrowIcon />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">No hay evaluaciones registradas para este equipo.</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Las evaluaciones aparecerán aquí cuando los miembros del equipo completen sus evaluaciones.
              </Typography>
            </Alert>
          )}
        </TabPanel>
      </Card>

      {/* Diálogo de edición */}
      <TeamEditor open={showEditDialog} team={team} onClose={() => setShowEditDialog(false)} onSave={handleEditTeam} />

      {/* Diálogo de invitaciones */}
      <Dialog open={showInvitationsDialog} onClose={() => setShowInvitationsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Gestión de Invitaciones</Typography>
          <IconButton onClick={() => setShowInvitationsDialog(false)}>
            <CloseIcon color="error" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TeamInvitations teamId={teamId} team={team} onClose={() => setShowInvitationsDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal de visualización de evaluaciones */}
      <EvaluationViewer open={evaluationViewerOpen} evaluationId={selectedEvaluationId} onClose={handleCloseEvaluationViewer} />

      {/* Dialog de análisis comparativo */}
      <ComparativeAnalysisDialog
        open={showComparativeDialog}
        onClose={() => setShowComparativeDialog(false)}
        teamId={teamId}
        teamName={team?.name}
      />
    </Box>
  );
}
