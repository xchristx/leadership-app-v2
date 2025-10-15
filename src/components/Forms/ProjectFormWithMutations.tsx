// ============================================================================
// FORMULARIO DE PROYECTO CON MUTACIONES RTK QUERY
// ============================================================================
// Wrapper del ProjectForm que usa las mutaciones RTK Query para operaciones
// ============================================================================

import { ProjectForm, type ProjectFormProps } from './ProjectForm';
import { useCreateProjectMutation, useUpdateProjectMutation } from '../../hooks/useProjects';
import { useAuth } from '../../hooks/useAuth';

interface ProjectFormWithMutationsProps extends Omit<ProjectFormProps, 'onSubmit' | 'isLoading'> {
  projectId?: string; // Solo necesario para modo edit
  onSuccess?: (projectId?: string) => void;
}

export function ProjectFormWithMutations({ projectId, onSuccess, mode, ...props }: ProjectFormWithMutationsProps) {
  // Mutaciones RTK Query
  const createProjectMutation = useCreateProjectMutation();
  const updateProjectMutation = useUpdateProjectMutation();
  const { profile } = useAuth();

  const handleSubmit = async (formData: Parameters<ProjectFormProps['onSubmit']>[0]) => {
    try {
      if (mode === 'create') {
        // Crear nuevo proyecto
        const result = await createProjectMutation.mutateAsync({
          organization_id: profile?.organization_id || '',
          name: formData.name,
          description: formData.description,
          hierarchy_levels: 3, // Valor por defecto
          template_id: formData.template_id,
          start_date: formData.start_date?.toISOString(),
          end_date: formData.end_date?.toISOString(),
          // Configuraciones
          allow_re_evaluation: formData.allow_re_evaluation,
          require_evaluator_info: formData.require_evaluator_info,
          evaluation_deadline: formData.evaluation_deadline?.toISOString(),
          reminder_days: formData.reminder_days,
          email_notifications: formData.email_notifications,
        });

        console.log('Proyecto creado exitosamente:', result.id);
        onSuccess?.(result.id);
        return { success: true };
      } else if (mode === 'edit' && projectId) {
        // Actualizar proyecto existente
        const result = await updateProjectMutation.mutateAsync({
          projectId,
          formData: {
            name: formData.name,
            description: formData.description,
            start_date: formData.start_date?.toISOString(),
            end_date: formData.end_date?.toISOString(),
            status: formData.status,
            // Configuraciones
            allow_re_evaluation: formData.allow_re_evaluation,
            require_evaluator_info: formData.require_evaluator_info,
            evaluation_deadline: formData.evaluation_deadline?.toISOString(),
            reminder_days: formData.reminder_days,
            email_notifications: formData.email_notifications,
          },
        });

        console.log('Proyecto actualizado exitosamente:', result.id);
        onSuccess?.(result.id);
        return { success: true };
      }

      return { success: false, error: 'Modo de operación inválido' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error en formulario de proyecto:', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const isLoading = createProjectMutation.isPending || updateProjectMutation.isPending;

  return <ProjectForm {...props} mode={mode} onSubmit={handleSubmit} isLoading={isLoading} />;
}
