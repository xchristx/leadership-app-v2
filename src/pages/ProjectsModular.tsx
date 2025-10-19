// ============================================================================
// PÁGINA DE PROYECTOS MODULAR
// ============================================================================
// Lista y gestión de proyectos con componentes modulares
// ============================================================================

import {
  Box,
  Typography,
  Button,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomTable, type Column } from '../components';
import { ProjectForm, TeamForm } from '../components/Forms';
import { useProjects, useTeams } from '../hooks';
import type { Project, Team } from '../types';
import { ProjectCard, ProjectEditor, ProjectViewer } from '../components/Projects';
import { TeamCard, TeamEditor } from '../components/Teams/index';
import type { CreateTeamData } from '../services/teamService';
import type { TeamFormData } from '../components/Forms/TeamForm';

// Tipo para datos del formulario de creación de proyecto
type ProjectFormData = {
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  start_date: Date | null;
  end_date: Date | null;
  budget: number | null;
  max_teams: number | null;
  template_id: string;
};

type ViewMode = 'cards' | 'table';
type SortBy = 'name' | 'created_at' | 'status' | 'completion_rate';

export function ProjectsModular() {
  const navigate = useNavigate();
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects();
  const { teams, createTeamWithInvitations, updateTeam, deleteTeam, refetch: refetchTeams } = useTeams();

  console.log({ teams, projects });
  // Estado de la UI
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');

  // Estado de modales
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewerDialogOpen, setViewerDialogOpen] = useState(false);
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);

  // Estado de operaciones
  const [operationLoading, setOperationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar y ordenar proyectos
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        project =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }
    // Ordenamiento
    const filteredAndOrdered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'completion_rate':
          return (b._stats?.completion_rate || 0) - (a._stats?.completion_rate || 0);
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filteredAndOrdered;
  }, [projects, searchTerm, statusFilter, sortBy]);

  // Handlers para modales
  const handleCreateProject = () => {
    setError(null);
    setCreateDialogOpen(true);
  };

  const handleViewProject = (project: Project) => {
    // Navegar a la página de detalles del proyecto
    navigate(`/projects/${project.id}`);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setEditorDialogOpen(true);
  };

  // Estados para gestión de equipos
  const [teamsDialogOpen, setTeamsDialogOpen] = useState(false);
  const [teamCreateDialogOpen, setTeamCreateDialogOpen] = useState(false);
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState<Team | null>(null);
  const [teamEditorOpen, setTeamEditorOpen] = useState(false);

  const handleManageTeams = (project: Project) => {
    // Navegar a la página de detalles del proyecto
    navigate(`/projects/${project.id}`);
  };

  // Handlers para equipos
  const handleCreateTeam = async (teamData: TeamFormData) => {
    try {
      // Convertir TeamFormData a CreateTeamData
      const createData: CreateTeamData = {
        name: teamData.name,
        project_id: teamData.project_id,
        team_size: teamData.team_size,
        is_active: teamData.is_active,
      };

      const result = await createTeamWithInvitations(createData);

      if (result.success) {
        setTeamCreateDialogOpen(false);
        refetchTeams();
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

  const handleEditTeam = async (teamData: Omit<Team, 'id' | 'created_at' | 'updated_at'>) => {
    if (!selectedTeamForEdit) return { success: false, error: 'No hay equipo seleccionado' };

    try {
      // Convertir a UpdateTeamData
      const updateData = {
        name: teamData.name,
        team_size: teamData.team_size,
        leader_name: teamData.leader_name,
        leader_email: teamData.leader_email,
        is_active: teamData.is_active,
      };

      const result = await updateTeam(selectedTeamForEdit.id, updateData);

      if (result.success) {
        setSelectedTeamForEdit(null);
        setTeamEditorOpen(false);
        refetchTeams();
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
          refetchTeams();
        } else {
          setError(result.error || 'Error al eliminar equipo');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Error al eliminar equipo');
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      setOperationLoading(true);
      try {
        const result = await deleteProject(projectId);
        if (!result.success) {
          setError(result.error || 'Error al eliminar el proyecto');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setOperationLoading(false);
      }
    }
  };

  // Handlers para formularios
  const handleCreateSubmit = async (data: ProjectFormData): Promise<{ success: boolean; error?: string }> => {
    setOperationLoading(true);
    try {
      const projectData = {
        name: data.name,
        description: data.description,
        status: data.status,
        start_date: data.start_date?.toISOString(),
        end_date: data.end_date?.toISOString(),
        template_id: data.template_id,
        hierarchy_levels: 2 as const,
      };

      const result = await createProject(projectData);

      if (result.success) {
        setCreateDialogOpen(false);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
      return { success: false, error: errorMessage };
    } finally {
      setOperationLoading(false);
    }
  };

  const handleEditSubmit = async (data: ProjectFormData): Promise<{ success: boolean; error?: string }> => {
    if (!selectedProject) return { success: false, error: 'No hay proyecto seleccionado' };

    setOperationLoading(true);
    try {
      const updates = {
        name: data.name,
        description: data.description,
        status: data.status,
        start_date: data.start_date?.toISOString(),
        end_date: data.end_date?.toISOString(),
        template_id: data.template_id,
      };

      const result = await updateProject(selectedProject.id, updates);

      if (result.success) {
        setEditorDialogOpen(false);
        setSelectedProject(null);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
      return { success: false, error: errorMessage };
    } finally {
      setOperationLoading(false);
    }
  };

  // Configuración de columnas para la tabla
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const columns: Column<Project>[] = [
    {
      id: 'name',
      label: 'Nombre',
      sortable: true,
      render: (value, row) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {String(value)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.description || 'Sin descripción'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Estado',
      align: 'center',
      render: value => {
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
        return getStatusLabel(String(value));
      },
    },
    {
      id: 'created_at',
      label: 'Fecha Creación',
      sortable: true,
      render: value => formatDate(String(value)),
    },
    {
      id: '_stats',
      label: 'Progreso',
      align: 'center',
      render: (_, row) => `${(row._stats?.completion_rate || 0).toFixed(1)}%`,
    },
  ];

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Proyectos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona tus proyectos de evaluación de liderazgo
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateProject} disabled={operationLoading}>
          Nuevo Proyecto
        </Button>
      </Box>

      {/* Controles */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Búsqueda */}
        <TextField
          placeholder="Buscar proyectos..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />

        {/* Filtro por estado */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label="Estado">
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="draft">Borrador</MenuItem>
            <MenuItem value="active">Activo</MenuItem>
            <MenuItem value="completed">Completado</MenuItem>
            <MenuItem value="archived">Archivado</MenuItem>
          </Select>
        </FormControl>

        {/* Ordenamiento */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} label="Ordenar por">
            <MenuItem value="created_at">Fecha creación</MenuItem>
            <MenuItem value="name">Nombre</MenuItem>
            <MenuItem value="status">Estado</MenuItem>
            <MenuItem value="completion_rate">Progreso</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1 }} />

        {/* Modo de vista */}
        <ToggleButtonGroup value={viewMode} exclusive onChange={(_, newMode) => newMode && setViewMode(newMode)} size="small">
          <ToggleButton value="cards">
            <ViewModuleIcon />
          </ToggleButton>
          <ToggleButton value="table">
            <ViewListIcon />
          </ToggleButton>
        </ToggleButtonGroup>

        <Button variant="outlined" startIcon={<DownloadIcon />} size="small">
          Exportar
        </Button>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Contenido principal */}
      {viewMode === 'cards' ? (
        <Grid container spacing={3}>
          {filteredProjects.map(project => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project.id}>
              <ProjectCard
                project={project}
                onView={handleViewProject}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                onManageTeams={handleManageTeams}
                loading={operationLoading}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <CustomTable
          data={filteredProjects}
          columns={columns}
          loading={isLoading}
          onRowClick={handleViewProject}
          emptyMessage="No hay proyectos disponibles"
        />
      )}

      {/* Modal para crear proyecto */}
      <Dialog open={createDialogOpen} onClose={() => !operationLoading && setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <ProjectForm
              onSubmit={handleCreateSubmit}
              onCancel={() => setCreateDialogOpen(false)}
              isLoading={operationLoading}
              mode="create"
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal para ver proyecto */}
      <Dialog open={viewerDialogOpen} onClose={() => setViewerDialogOpen(false)} maxWidth="lg" fullWidth>
        {selectedProject && (
          <ProjectViewer
            project={selectedProject}
            onEdit={handleEditProject}
            onManageTeams={handleManageTeams}
            onManageConfiguration={() => console.log('Manage config')}
            onViewReports={() => console.log('View reports')}
            onExportData={() => console.log('Export data')}
          />
        )}
        <DialogActions>
          <Button onClick={() => setViewerDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal para editar proyecto */}
      <ProjectEditor
        open={editorDialogOpen}
        project={selectedProject}
        onClose={() => {
          setEditorDialogOpen(false);
          setSelectedProject(null);
        }}
        onSave={handleEditSubmit}
        loading={operationLoading}
      />

      {/* Modal para gestión de equipos */}
      <Dialog open={teamsDialogOpen} onClose={() => setTeamsDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Gestión de Equipos - {selectedProject?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setTeamCreateDialogOpen(true)}>
                Crear Equipo
              </Button>
            </Box>

            {/* Lista de equipos del proyecto */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
              {teams
                .filter(team => team.project_id === selectedProject?.id)
                .map(team => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    onEdit={(team: Team) => {
                      setSelectedTeamForEdit(team);
                      setTeamEditorOpen(true);
                    }}
                    onDelete={handleDeleteTeam}
                    onView={(team: Team) => console.log('Ver detalles', team)}
                  />
                ))}
            </Box>

            {teams.filter(team => team.project_id === selectedProject?.id).length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No hay equipos creados para este proyecto. Haz clic en "Crear Equipo" para empezar.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamsDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal para crear equipo */}
      <Dialog open={teamCreateDialogOpen} onClose={() => setTeamCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nuevo Equipo</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TeamForm
              mode="create"
              onSubmit={handleCreateTeam}
              onCancel={() => setTeamCreateDialogOpen(false)}
              initialData={{ project_id: selectedProject?.id }}
            />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Modal para editar equipo */}
      <TeamEditor
        open={teamEditorOpen}
        team={selectedTeamForEdit}
        onClose={() => {
          setTeamEditorOpen(false);
          setSelectedTeamForEdit(null);
        }}
        onSave={handleEditTeam}
        loading={false}
      />
    </Box>
  );
}
