// ============================================================================
// PÁGINA PRINCIPAL DE EQUIPOS
// ============================================================================
// Vista modular para gestión completa de equipos
// ============================================================================

import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Chip,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Group as GroupIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useState } from 'react';

import { useTeams } from '../hooks/useTeams';
import { useProjects } from '../hooks/useProjects';
import { TeamCard, TeamEditor, TeamDashboard } from '../components/Teams/index';
import { TeamForm } from '../components/Forms';
import type { Team, Project, TeamFormData } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`teams-tabpanel-${index}`} aria-labelledby={`teams-tab-${index}`} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export function TeamsModular() {
  // Estados para UI
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedTeamForDashboard, setSelectedTeamForDashboard] = useState<Team | null>(null);

  // Hooks
  const { teams, stats, isLoading, isError, error, createTeamWithInvitations, updateTeam, deleteTeam, refetch } = useTeams();

  const { projects } = useProjects();

  // Filtros aplicados
  const filteredTeams = teams.filter((team: Team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProjectId && team.project_id === selectedProjectId;
    return matchesSearch && matchesProject;
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateTeam = async (teamData: TeamFormData) => {
    try {
      // Convertir TeamFormData a CreateTeamData

      const result = await createTeamWithInvitations(teamData);

      if (result.success) {
        setShowCreateDialog(false);
        refetch();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear equipo',
      };
    }
  };

  const handleEditTeam = async (teamData: TeamFormData) => {
    if (!selectedTeam) return { success: false, error: 'No hay equipo seleccionado' };

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

      const result = await updateTeam(selectedTeam.id, updateData);

      if (result.success) {
        setShowEditDialog(false);
        setSelectedTeam(null);
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

  const handleDeleteTeam = async (teamId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este equipo?')) {
      try {
        const result = await deleteTeam(teamId);

        if (result.success) {
          refetch();
        } else {
          console.error('Error al eliminar equipo:', result.error);
        }
      } catch (error) {
        console.error('Error al eliminar equipo:', error);
      }
    }
  };

  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setShowEditDialog(true);
  };

  const openDashboard = (team: Team) => {
    setSelectedTeamForDashboard(team);
    setTabValue(2); // Cambiar a la pestaña del dashboard
  };

  return (
    <Box
      sx={{
        px: { xs: 0.5, sm: 2, md: 3 },
        py: { xs: 1, sm: 2, md: 3 },
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Gestión de Equipos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra y supervisa todos los equipos de la organización
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
          size="large"
          sx={{ mt: { xs: 1, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}
        >
          Nuevo Equipo
        </Button>
      </Box>

      {/* Estadísticas rápidas */}
      <Grid container spacing={3} sx={{ mb: 3, display: 'none' }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total de Equipos
                  </Typography>
                  <Typography variant="h4">{stats.total}</Typography>
                </Box>
                <GroupIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Equipos Activos
                  </Typography>
                  <Typography variant="h4">{stats.active}</Typography>
                </Box>
                <GroupIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Equipos Inactivos
                  </Typography>
                  <Typography variant="h4">{stats.inactive}</Typography>
                </Box>
                <GroupIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid sx={{ display: 'none' }} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Proyectos
                  </Typography>
                  <Typography variant="h4">{Object.keys(stats.by_project).length}</Typography>
                </Box>
                <BusinessIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs principales */}
      <Card sx={{ px: { xs: 0.5, sm: 2 }, width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs variant={'scrollable'} allowScrollButtonsMobile value={tabValue} onChange={handleTabChange}>
            <Tab label="Todos los Equipos" />
            <Tab label="Vista de Tarjetas" />
            <Tab label="Dashboard de Equipo" />
          </Tabs>
        </Box>

        {/* Panel: Lista de equipos */}
        <TabPanel value={tabValue} index={0}>
          {/* Filtros */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 3,
              flexWrap: 'wrap',
              alignItems: { xs: 'stretch', sm: 'center' },
              width: '100%',
            }}
          >
            <TextField
              placeholder="Buscar equipos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { xs: '100%', sm: 250 }, width: { xs: '100%', sm: 'auto' } }}
              fullWidth={true}
            />

            <FormControl sx={{ minWidth: { xs: '100%', sm: 200 }, width: { xs: '100%', sm: 'auto' } }} fullWidth={true}>
              <InputLabel>Proyecto</InputLabel>
              <Select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} label="Proyecto">
                <MenuItem value="">Todos</MenuItem>
                {projects.map((project: Project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {(searchTerm || selectedProjectId) && (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedProjectId('');
                }}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Limpiar filtros
              </Button>
            )}
          </Box>

          {/* Resultados */}
          {!selectedProjectId ? (
            <Alert severity="info">Selecciona un proyecto para ver los equipos asociados.</Alert>
          ) : isLoading ? (
            <Typography>Cargando equipos...</Typography>
          ) : isError ? (
            <Alert severity="error">Error al cargar equipos: {error ? String(error) : 'Error desconocido'}</Alert>
          ) : filteredTeams.length === 0 ? (
            <Alert severity="info">No se encontraron equipos que coincidan con los filtros aplicados.</Alert>
          ) : (
            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ width: '100%', margin: 0 }}>
              {filteredTeams.map((team: Team) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={team.id} sx={{ width: '100%' }}>
                  <TeamCard team={team} onEdit={openEditDialog} onDelete={handleDeleteTeam} onView={openDashboard} />
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Panel: Vista de tarjetas simplificada */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Vista de Tarjetas ({filteredTeams.length} equipos)
          </Typography>

          <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ width: '100%', margin: 0 }}>
            {filteredTeams.map((team: Team) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={team.id} sx={{ width: '100%' }}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 },
                    minHeight: { xs: 120, sm: 140 },
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                  onClick={() => openDashboard(team)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom noWrap>
                      {team.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tamaño: {team.team_size || 'No especificado'} miembros
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={team.is_active ? 'Activo' : 'Inactivo'} color={team.is_active ? 'success' : 'default'} size="small" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Panel: Dashboard de equipo seleccionado */}
        <TabPanel value={tabValue} index={2}>
          {selectedTeamForDashboard ? (
            <TeamDashboard teamId={selectedTeamForDashboard.id} />
          ) : (
            <Alert severity="info">Selecciona un equipo desde la lista para ver su dashboard detallado.</Alert>
          )}
        </TabPanel>
      </Card>

      {/* Diálogo para crear equipo */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nuevo Equipo</DialogTitle>
        <DialogContent>
          <TeamForm mode="create" onSubmit={handleCreateTeam} onCancel={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Diálogo para editar equipo */}
      <TeamEditor
        open={showEditDialog}
        team={selectedTeam}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedTeam(null);
        }}
        onSave={handleEditTeam}
      />
    </Box>
  );
}
