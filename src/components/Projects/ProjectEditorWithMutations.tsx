// ============================================================================
// COMPONENTE PROJECT EDITOR CON MUTACIONES RTK QUERY
// ============================================================================
// Diálogo modal para editar proyectos usando las mutaciones integradas
// ============================================================================

import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ProjectFormWithMutations } from '../../components/Forms';
import type { Project } from '../../types';

export interface ProjectEditorWithMutationsProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onSuccess?: (projectId?: string) => void;
}

export function ProjectEditorWithMutations({ open, project, onClose, onSuccess }: ProjectEditorWithMutationsProps) {
  const handleClose = () => {
    onClose();
  };

  const handleSuccess = (projectId?: string) => {
    onClose();
    onSuccess?.(projectId);
  };

  // Convertir el proyecto a los datos del formulario
  const getInitialData = (project: Project): Partial<Project> => {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date,
      template_id: project.template_id,
      hierarchy_levels: project.hierarchy_levels,
      configuration: project.configuration,
    };
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
        }}
      >
        Editar Proyecto
        <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {project && (
          <ProjectFormWithMutations
            mode="edit"
            projectId={project.id}
            initialData={getInitialData(project)}
            onCancel={handleClose}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
