// ============================================================================
// COMPONENTE PROJECT EDITOR
// ============================================================================
// Diálogo modal para editar proyectos existentes
// ============================================================================

import { Dialog, DialogTitle, DialogContent, IconButton, Box, Alert, CircularProgress } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ProjectForm } from '../../components/Forms';
import type { Project } from '../../types';
import { useState, useEffect } from 'react';
import { getProjectEvaluations } from '../../services/evaluationService';

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
  const [hasEvaluations, setHasEvaluations] = useState<boolean>(false);
  const [checkingEvaluations, setCheckingEvaluations] = useState<boolean>(false);

  // Verificar si el proyecto tiene evaluaciones existentes
  useEffect(() => {
    const checkProjectEvaluations = async () => {
      if (!project?.id || !open) {
        setHasEvaluations(false);
        return;
      }

      try {
        setCheckingEvaluations(true);
        setError(null);

        const evaluations = await getProjectEvaluations(project.id);
        setHasEvaluations(evaluations.length > 0);

        if (evaluations.length > 0) {
          console.log(`Proyecto tiene ${evaluations.length} evaluaciones existentes`);
        }
      } catch (err) {
        console.error('Error al verificar evaluaciones del proyecto:', err);
        // No es crítico, asumimos que no hay evaluaciones
        setHasEvaluations(false);
      } finally {
        setCheckingEvaluations(false);
      }
    };

    checkProjectEvaluations();
  }, [project?.id, open]);

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
    return project;
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

        {/* Mostrar información sobre evaluaciones existentes */}
        {project && hasEvaluations && !checkingEvaluations && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Proyecto con evaluaciones:</strong> Este proyecto ya tiene evaluaciones completadas. Algunos campos estarán bloqueados
            para mantener la consistencia de los datos.
          </Alert>
        )}

        {project && (
          <Box sx={{ mt: 2 }}>
            {checkingEvaluations ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                Verificando evaluaciones existentes...
              </Box>
            ) : (
              <ProjectForm
                initialData={getFormData(project)}
                onSubmit={handleSubmit}
                onCancel={handleClose}
                isLoading={loading}
                mode="edit"
                hasEvaluations={hasEvaluations}
              />
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
