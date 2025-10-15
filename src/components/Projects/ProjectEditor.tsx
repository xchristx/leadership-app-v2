// ============================================================================
// COMPONENTE PROJECT EDITOR
// ============================================================================
// Diálogo modal para editar proyectos existentes
// ============================================================================

import { Dialog, DialogTitle, DialogContent, IconButton, Box, Alert } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ProjectForm } from '../../components/Forms';
import type { Project } from '../../types';
import { useState } from 'react';

// Tipo local que coincide con el ProjectForm
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

export interface ProjectEditorProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onSave: (projectData: ProjectFormData) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export function ProjectEditor({ open, project, onClose, onSave, loading = false }: ProjectEditorProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      setError(null);
      const result = await onSave(data);

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Error al guardar el proyecto');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  // Convertir el proyecto a los datos del formulario
  const getFormData = (project: Project): Partial<Project> => {
    return {
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date,
      template_id: project.template_id,
      hierarchy_levels: project.hierarchy_levels,
    };
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        Editar Proyecto
        <IconButton onClick={handleClose} disabled={loading} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {project && (
          <Box sx={{ mt: 2 }}>
            <ProjectForm
              initialData={getFormData(project)}
              onSubmit={handleSubmit}
              onCancel={handleClose}
              isLoading={loading}
              mode="edit"
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
