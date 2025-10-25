// ============================================================================
// COMPONENTE TEAM DASHBOARD - DISEÑO RESPONSIVO
// ============================================================================
// Dashboard avanzado para equipos con diseño completamente responsivo
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
  useTheme,
  useMediaQuery,
  Drawer,
  Stack,
  Fade,
  Zoom,
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
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';

import { useTeam, useTeams } from '../../hooks/useTeams';
import { TeamEditor } from './TeamEditor';
import { TeamInvitations } from './TeamInvitations';
import { ComparativeAnalysisDialog } from './ComparativeAnalysisDialog';
import { EvaluationViewer } from '..';
import type { Team, TeamFormData } from '../../types';

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
      {value === index && <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

export function TeamDashboard({ teamId }: TeamDashboardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [tabValue, setTabValue] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInvitationsDialog, setShowInvitationsDialog] = useState(false);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [evaluationViewerOpen, setEvaluationViewerOpen] = useState(false);
  const [showComparativeDialog, setShowComparativeDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { team, stats, dashboard, isLoading, isError, error, loadStats, loadDashboard, refetch } = useTeam(teamId);
  const { updateTeam } = useTeams(teamId);

  // Cargar datos al montar
  useEffect(() => {
    if (teamId) {
      loadStats();
      loadDashboard();
    }
  }, [teamId, loadStats, loadDashboard]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const handleRefresh = () => {
    refetch();
    loadStats();
    loadDashboard();
  };

  const handleEditTeam = async (teamData: TeamFormData) => {
    try {
      // Convertir TeamFormData a UpdateTeamData
      const updateData = {
        name: teamData.name,
        team_size: teamData.team_size ?? undefined,
        leader_name: teamData.leader_name ?? undefined,
        leader_email: teamData.leader_email ?? undefined,
        is_active: teamData.is_active ?? undefined,
        department: teamData.department ?? undefined,
      };

      const result = await updateTeam(teamId, updateData);

      if (result.success) {
        setShowEditDialog(false);
        refetch();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
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
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant={isMobile ? 'body1' : 'h6'}>Cargando dashboard del equipo...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (isError || !team) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Error al cargar el equipo: {error?.message || 'Equipo no encontrado'}
        </Alert>
      </Box>
    );
  }

  const totalMembers = stats?.total_members || 0;
  const completedEvaluations = stats?.completed_evaluations || 0;

  // Calcular progreso basado en miembros esperados del equipo
  const expectedMembers = team.team_size || 0;
  const actualCompletionRate = expectedMembers > 0 ? (completedEvaluations / expectedMembers) * 100 : 0;

  // Componente para botones de acción responsivos
  const ActionButtons = () => (
    <Stack direction={isMobile ? 'column' : 'row'} spacing={1} sx={{ width: isMobile ? '100%' : 'auto' }}>
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={handleRefresh}
        size={isMobile ? 'small' : 'medium'}
        fullWidth={isMobile}
      >
        {isMobile ? 'Actualizar' : 'Actualizar'}
      </Button>
      <Button
        variant="outlined"
        startIcon={<Edit />}
        onClick={() => setShowEditDialog(true)}
        size={isMobile ? 'small' : 'medium'}
        fullWidth={isMobile}
      >
        {isMobile ? 'Editar' : 'Editar'}
      </Button>
      <Button
        variant="contained"
        startIcon={<LinkIcon />}
        onClick={() => setShowInvitationsDialog(true)}
        size={isMobile ? 'small' : 'medium'}
        fullWidth={isMobile}
      >
        {isMobile ? 'Invitaciones' : 'Invitaciones'}
      </Button>
    </Stack>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Distintivo de equipo de liderazgo de proyecto */}
      {isLeadershipTeam && (
        <Zoom in timeout={600}>
          <Card
            sx={{
              mb: { xs: 2, sm: 3 },
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: { xs: 2, sm: 3 },
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' },
                  textAlign: { xs: 'center', sm: 'left' },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    width: { xs: 48, sm: 56 },
                    height: { xs: 48, sm: 56 },
                  }}
                >
                  <StarIcon fontSize={isMobile ? 'medium' : 'large'} />
                </Avatar>

                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                    📊 Evaluación de Liderazgo del Proyecto
                  </Typography>
                  <Typography variant={isMobile ? 'caption' : 'body2'} sx={{ opacity: 0.9, mt: 0.5 }}>
                    Líder del proyecto + Líderes de equipo como evaluadores
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                    Creado: {new Date(team.created_at).toLocaleDateString('es-ES')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Zoom>
      )}

      {/* Header del dashboard */}
      <Fade in timeout={800}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: { xs: 2, sm: 3 },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              gutterBottom
              sx={{
                wordBreak: 'break-word',
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              {team.name}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mb: 2,
                flexWrap: 'wrap',
              }}
            >
              <Chip
                label={team.is_active ? 'Activo' : 'Inactivo'}
                color={team.is_active ? 'success' : 'default'}
                size={isMobile ? 'small' : 'medium'}
              />
              {isLeadershipTeam && (
                <Chip
                  label={isMobile ? 'Liderazgo' : 'Liderazgo de Proyecto'}
                  color="warning"
                  icon={<StarIcon sx={{ color: '#ffd700', fontSize: isMobile ? 'small' : 'medium' }} />}
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#fffbe6',
                    color: '#7c4700',
                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                  }}
                  size={isMobile ? 'small' : 'medium'}
                />
              )}
            </Box>
          </Box>

          {/* Botones de acción - Versión desktop/tablet */}
          {!isMobile && <ActionButtons />}

          {/* Botón de menú móvil */}
          {isMobile && (
            <Box sx={{ width: '100%' }}>
              <Button variant="outlined" startIcon={<MenuIcon />} onClick={() => setMobileMenuOpen(true)} fullWidth size="small">
                Menú de Acciones
              </Button>
            </Box>
          )}
        </Box>
      </Fade>

      {/* Métricas principales */}
      <Fade in timeout={800} style={{ transitionDelay: '200ms' }}>
        <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent
                sx={{
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  '&:last-child': { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                      Miembros esperados
                    </Typography>
                    <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                      {team.team_size || 0}
                    </Typography>
                  </Box>
                  <GroupIcon color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent
                sx={{
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  '&:last-child': { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                      Miembros registrados
                    </Typography>
                    <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                      {totalMembers}
                    </Typography>
                  </Box>
                  <GroupIcon color="success" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent
                sx={{
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  '&:last-child': { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                      Evaluaciones completadas
                    </Typography>
                    <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                      {completedEvaluations}
                    </Typography>
                  </Box>
                  <AssessmentIcon color="info" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent
                sx={{
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  '&:last-child': { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                      Progreso
                    </Typography>
                    <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                      {actualCompletionRate.toFixed(0)}%
                    </Typography>
                  </Box>
                  <TrendingUpIcon color="warning" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Fade>

      {/* Tabs de contenido */}
      <Fade in timeout={800} style={{ transitionDelay: '400ms' }}>
        <Card sx={{ borderRadius: { xs: 2, sm: 3 } }}>
          {/* Header de tabs - Versión desktop */}
          {!isMobile && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: { xs: 1, sm: 2 },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 2, sm: 0 },
                }}
              >
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  sx={{
                    '& .MuiTab-root': {
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      py: { xs: 1, sm: 2 },
                      minHeight: 'auto',
                      minWidth: { xs: 'auto', sm: 160 },
                    },
                  }}
                >
                  <Tab label="Resumen" icon={<DashboardIcon />} iconPosition="start" />
                  <Tab label="Invitaciones" icon={<LinkIcon />} iconPosition="start" />
                  <Tab label="Evaluaciones" icon={<AssessmentIcon />} iconPosition="start" />
                </Tabs>

                <Button
                  variant="outlined"
                  startIcon={<TimelineIcon />}
                  onClick={() => setShowComparativeDialog(true)}
                  size={isTablet ? 'small' : 'medium'}
                >
                  {isTablet ? 'Análisis' : 'Análisis Comparativo'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Header de tabs - Versión móvil */}
          {isMobile && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    py: 1,
                    minHeight: 'auto',
                  },
                }}
              >
                <Tab label="Resumen" icon={<DashboardIcon sx={{ fontSize: 18 }} />} iconPosition="top" />
                <Tab label="Invitaciones" icon={<LinkIcon sx={{ fontSize: 18 }} />} iconPosition="top" />
                <Tab label="Evaluaciones" icon={<AssessmentIcon sx={{ fontSize: 18 }} />} iconPosition="top" />
              </Tabs>
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<TimelineIcon />}
                  onClick={() => setShowComparativeDialog(true)}
                  size="small"
                  fullWidth
                >
                  Análisis Comparativo
                </Button>
              </Box>
            </Box>
          )}

          {/* Panel de Resumen */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {/* Progreso de evaluaciones */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom>
                      Progreso de Evaluaciones
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Completadas: {completedEvaluations}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Esperadas: {expectedMembers}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={actualCompletionRate}
                        sx={{
                          height: { xs: 8, sm: 12 },
                          borderRadius: { xs: 4, sm: 6 },
                        }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          mt: 1,
                          display: 'block',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        }}
                      >
                        {actualCompletionRate.toFixed(1)}% completado
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Miembros Registrados */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom>
                      Miembros Registrados
                    </Typography>
                    {dashboard?.recent_evaluations && dashboard.recent_evaluations.length > 0 ? (
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          }}
                        >
                          {totalMembers} miembro{totalMembers !== 1 ? 's' : ''} registrado{totalMembers !== 1 ? 's' : ''}
                        </Typography>
                        <List dense sx={{ maxHeight: { xs: 150, sm: 200 }, overflow: 'auto' }}>
                          {Array.from(
                            new Map(
                              dashboard.recent_evaluations.map(evaluation => [evaluation.evaluator_name || evaluation.id, evaluation])
                            ).values()
                          )
                            .slice(0, isMobile ? 3 : 5)
                            .map(evaluation => (
                              <ListItem key={evaluation.id} sx={{ py: 0.5, px: 0 }}>
                                <ListItemAvatar>
                                  <Avatar
                                    sx={{
                                      width: { xs: 28, sm: 32 },
                                      height: { xs: 28, sm: 32 },
                                      bgcolor: 'primary.main',
                                      fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                    }}
                                  >
                                    {(evaluation.evaluator_name || 'A').charAt(0).toUpperCase()}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }} noWrap>
                                      {evaluation.evaluator_name || 'Evaluador anónimo'}
                                    </Typography>
                                  }
                                  secondary={
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0, sm: 1 } }}>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                      >
                                        {evaluation.evaluator_role === 'leader' ? 'Líder' : 'Colaborador'}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                                      >
                                        • Evaluación #{evaluation.id.slice(0, 6)}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </ListItem>
                            ))}
                        </List>
                      </Box>
                    ) : (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          No hay miembros registrados aún.
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
                    <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom>
                      Información del Equipo
                    </Typography>
                    <Grid container spacing={{ xs: 1, sm: 2 }}>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Tamaño del Equipo
                        </Typography>
                        <Typography variant={isMobile ? 'body1' : 'h6'} sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }}>
                          {team.team_size || 'No especificado'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Líder del Equipo
                        </Typography>
                        <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                          {team.leader_name || 'No asignado'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Estado
                        </Typography>
                        <Chip
                          label={team.is_active ? 'Activo' : 'Inactivo'}
                          color={team.is_active ? 'success' : 'default'}
                          size={isMobile ? 'small' : 'medium'}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Fecha de Creación
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {new Date(team.created_at).toLocaleDateString('es-ES')}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Panel de Invitaciones */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'}>Gestión de Invitaciones</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {teamId ? (
                <TeamInvitations teamId={teamId} team={team} onClose={() => setShowInvitationsDialog(false)} />
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  No hay invitaciones creadas. Usa el botón "Invitaciones" para crear nuevas invitaciones.
                </Typography>
              )}
            </Box>
          </TabPanel>

          {/* Panel de Evaluaciones */}
          <TabPanel value={tabValue} index={2}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: { xs: 2, sm: 3 },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 },
              }}
            >
              <Typography variant={isMobile ? 'subtitle1' : 'h6'}>Evaluaciones del Equipo</Typography>
              <Chip
                label={`${dashboard?.recent_evaluations?.length || 0} evaluaciones`}
                color="primary"
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
              />
            </Box>

            {dashboard?.recent_evaluations && dashboard.recent_evaluations.length > 0 ? (
              <List sx={{ py: 0 }}>
                {dashboard.recent_evaluations.map(evaluation => {
                  const completionPercentage = evaluation.completion_percentage || 0;
                  const isComplete = completionPercentage >= 100;

                  return (
                    <ListItem
                      key={evaluation.id}
                      divider
                      sx={{
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        py: { xs: 2, sm: 1 },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: { xs: 1, sm: 0 },
                              flexWrap: 'wrap',
                            }}
                          >
                            <Typography variant="body1" fontWeight="medium" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                              {evaluation.evaluator_name || 'Evaluación anónima'}
                            </Typography>
                            <Chip label={isComplete ? 'Completa' : 'En progreso'} color={isComplete ? 'success' : 'warning'} size="small" />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1, width: '100%' }}>
                            <Grid container spacing={1}>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                >
                                  <strong>ID:</strong> #{evaluation.id.slice(0, 6)}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                >
                                  <strong>Rol:</strong> {evaluation.evaluator_role === 'leader' ? 'Líder' : 'Colaborador'}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                >
                                  <strong>Progreso:</strong> {completionPercentage}%
                                </Typography>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                >
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
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 3,
                                      backgroundColor: isComplete ? 'success.main' : 'warning.main',
                                    },
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 35, fontSize: '0.7rem' }}>
                                {completionPercentage}%
                              </Typography>
                            </Box>
                          </Box>
                        }
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                      />
                      <ListItemSecondaryAction
                        sx={{
                          position: { xs: 'static', sm: 'absolute' },
                          transform: { xs: 'none', sm: 'translateY(-50%)' },
                          top: { xs: 'auto', sm: '50%' },
                          right: { xs: 'auto', sm: 16 },
                          mt: { xs: 2, sm: 0 },
                        }}
                      >
                        <Tooltip title={isComplete ? 'Ver evaluación completa' : 'Continuar evaluación'}>
                          <IconButton
                            size="small"
                            color={isComplete ? 'primary' : 'warning'}
                            onClick={() => handleViewEvaluation(evaluation.id, isComplete)}
                          >
                            {isComplete ? <VisibilityIcon /> : <PlayArrowIcon />}
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  No hay evaluaciones registradas para este equipo.
                </Typography>
              </Alert>
            )}
          </TabPanel>
        </Card>
      </Fade>

      {/* Drawer móvil para acciones */}
      <Drawer
        anchor="bottom"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            maxHeight: '60vh',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
            Acciones del Equipo
          </Typography>
          <ActionButtons />
        </Box>
      </Drawer>

      {/* Diálogo de edición */}
      <TeamEditor open={showEditDialog} team={team} onClose={() => setShowEditDialog(false)} onSave={handleEditTeam} />

      {/* Diálogo de invitaciones */}
      <Dialog open={showInvitationsDialog} onClose={() => setShowInvitationsDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: { xs: 2, sm: 3 },
          }}
        >
          <Typography variant={isMobile ? 'h6' : 'h5'}>Gestión de Invitaciones</Typography>
          <IconButton onClick={() => setShowInvitationsDialog(false)} size={isMobile ? 'small' : 'medium'}>
            <CloseIcon color="error" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, sm: 3 } }}>
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
