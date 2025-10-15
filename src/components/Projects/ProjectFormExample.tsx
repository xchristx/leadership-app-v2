// ============================================================================
// EJEMPLO DE USO DE FORMULARIOS CON MUTACIONES
// ============================================================================
// Componente de demostración del uso de formularios con RTK Query
// ============================================================================

import { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { ProjectFormWithMutations } from '../../components/Forms';
import { ProjectEditorWithMutations } from './ProjectEditorWithMutations';
import { QueryClientTest } from '../../components/Debug';
import { useProjects } from '../../hooks/useProjects';
import type { Project } from '../../types';

export function ProjectFormExample() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { projects, isLoading } = useProjects();

  const handleCreateSuccess = (projectId?: string) => {
    console.log('Proyecto creado con ID:', projectId);
    setShowCreateForm(false);
  };

  const handleEditSuccess = (projectId?: string) => {
    console.log('Proyecto editado con ID:', projectId);
    setShowEditForm(false);
    setSelectedProject(null);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowEditForm(true);
  };

  if (isLoading) {
    return <Typography>Cargando proyectos...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Ejemplo de Formularios con Mutaciones RTK Query
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateForm(true)}>
          Crear Proyecto
        </Button>
      </Box>

      {/* Formulario de creación */}
      {showCreateForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Crear Nuevo Proyecto
          </Typography>
          <ProjectFormWithMutations mode="create" onCancel={() => setShowCreateForm(false)} onSuccess={handleCreateSuccess} />
        </Paper>
      )}

      {/* Lista de proyectos existentes */}
      <Typography variant="h6" gutterBottom>
        Proyectos Existentes
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {projects.length === 0 ? (
          <Typography color="text.secondary">No hay proyectos disponibles. Crea uno nuevo para comenzar.</Typography>
        ) : (
          projects.map(project => (
            <Paper key={project.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {project.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Estado: {project.status} | Creado: {new Date(project.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => handleEditProject(project)}>
                Editar
              </Button>
            </Paper>
          ))
        )}
      </Box>

      {/* Editor de proyecto */}
      <ProjectEditorWithMutations
        open={showEditForm}
        project={selectedProject}
        onClose={() => {
          setShowEditForm(false);
          setSelectedProject(null);
        }}
        onSuccess={handleEditSuccess}
      />

      {/* Test de QueryClient para debug */}
      <QueryClientTest />
    </Box>
  );
}
