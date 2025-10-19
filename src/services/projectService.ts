// ============================================================================
// SERVICIO DE PROYECTOS
// ============================================================================
// Funciones para CRUD de proyectos y operaciones relacionadas con Supabase
// ============================================================================

import { supabase } from '../lib/supabase';
import type {
    Project,
    CreateProjectData,
    UpdateProjectData
} from '../types';

// ============================================================================
// TIPOS ESPECÍFICOS DEL SERVICIO
// ============================================================================

export interface ProjectStats {
    total_teams: number;
    total_invitations: number;
    completed_evaluations: number;
    completion_rate: number;
    expected_members: number;
}

export interface CreateProjectWithConfigData {
    // Datos del proyecto
    organization_id: string;
    template_id: string;
    name: string;
    description?: string;
    hierarchy_levels?: number;
    start_date?: string;
    end_date?: string;
    status?: 'draft' | 'active' | 'completed' | 'archived';

    // Configuración adicional
    allow_re_evaluation?: boolean;
    require_evaluator_info?: boolean;
    evaluation_deadline?: string;
    reminder_days?: number[];
    email_notifications?: boolean;
}

// ============================================================================
// FUNCIONES PRINCIPALES DE PROYECTOS
// ============================================================================

/**
 * Obtener todos los proyectos de una organización
 */
export const getProjects = async (organizationId: string): Promise<Project[]> => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select(`
                id,
                organization_id,
                template_id,
                name,
                description,
                hierarchy_levels,
                status,
                start_date,
                end_date,
                created_by,
                created_at,
                updated_at,
                template:question_templates(
                    id,
                    title,
                    description
                )
            `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Error al obtener proyectos: ${error.message}`);
        }

        return data as Project[];
    } catch (error) {
        console.error('Error in getProjects:', error);
        throw error;
    }
};

/**
 * Obtener proyectos con estadísticas
 */
export const getProjectsWithStats = async (organizationId: string): Promise<Project[]> => {
    try {
        const projects = await getProjects(organizationId);

        // Obtener estadísticas para cada proyecto
        const projectsWithStats = await Promise.all(
            projects.map(async (project) => {
                const stats = await getProjectStats(project.id);
                return {
                    ...project,
                    _stats: stats
                };
            })
        );

        return projectsWithStats;
    } catch (error) {
        console.error('Error in getProjectsWithStats:', error);
        throw error;
    }
};

/**
 * Obtener un proyecto específico por ID
 */
export const getProject = async (projectId: string): Promise<Project | null> => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select(`
                id,
                organization_id,
                template_id,
                name,
                description,
                hierarchy_levels,
                status,
                start_date,
                end_date,
                created_by,
                created_at,
                updated_at,
                template:question_templates(
                    id,
                    title,
                    description
                ),
                configuration:project_configurations(
                    id,
                    allow_re_evaluation,
                    require_evaluator_info,
                    evaluation_deadline,
                    reminder_days,
                    email_notifications
                )
            `)
            .eq('id', projectId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Error al obtener proyecto: ${error.message}`);
        }

        const stats = await getProjectStats(projectId);

        return {
            ...data,
            _stats: stats
        } as Project;
    } catch (error) {
        console.error('Error in getProject:', error);
        throw error;
    }
};

/**
 * Crear un nuevo proyecto usando la función RPC
 */
export const createProject = async (projectData: CreateProjectWithConfigData): Promise<string> => {
    try {
        const { data, error } = await supabase.rpc('create_project_with_config', {
            p_organization_id: projectData.organization_id,
            p_template_id: projectData.template_id,
            p_name: projectData.name,
            p_description: projectData.description,
            p_hierarchy_levels: projectData.hierarchy_levels || 2,
            p_allow_re_evaluation: projectData.allow_re_evaluation || false,
            p_evaluation_deadline: projectData.evaluation_deadline
        });

        if (error) {
            throw new Error(`Error al crear proyecto: ${error.message}`);
        }

        return data as string;
    } catch (error) {
        console.error('Error in createProject:', error);
        throw error;
    }
};

/**
 * Crear proyecto básico (sin configuración avanzada)
 */
export const createBasicProject = async (projectData: CreateProjectData): Promise<Project> => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .insert([{
                organization_id: projectData.organization_id,
                template_id: projectData.template_id,
                name: projectData.name,
                description: projectData.description,
                hierarchy_levels: projectData.hierarchy_levels || 2,
                status: projectData.status || 'draft',
                start_date: projectData.start_date,
                end_date: projectData.end_date
            }])
            .select(`
                id,
                organization_id,
                template_id,
                name,
                description,
                hierarchy_levels,
                status,
                start_date,
                end_date,
                created_by,
                created_at,
                updated_at
            `)
            .single();

        if (error) {
            throw new Error(`Error al crear proyecto básico: ${error.message}`);
        }

        return data as Project;
    } catch (error) {
        console.error('Error in createBasicProject:', error);
        throw error;
    }
};

/**
 * Crear proyecto completo con configuración desde formulario
 */
export const createProjectFromForm = async (formData: {
    // Datos básicos del proyecto
    organization_id: string;
    template_id: string;
    name: string;
    description?: string;
    hierarchy_levels?: number;
    start_date?: string;
    end_date?: string;
    status?: string;

    // Configuraciones
    allow_re_evaluation: boolean;
    require_evaluator_info: boolean;
    evaluation_deadline?: string;
    reminder_days: number[];
    email_notifications: boolean;
}): Promise<Project> => {
    try {
        // 1. Crear el proyecto básico
        const projectData: CreateProjectData = {
            organization_id: formData.organization_id,
            template_id: formData.template_id,
            name: formData.name,
            description: formData.description,
            hierarchy_levels: formData.hierarchy_levels || 2,
            status: formData.status as 'draft' | 'active' | 'completed' | 'archived' || 'draft',
            start_date: formData.start_date,
            end_date: formData.end_date
        };

        const project = await createBasicProject(projectData);

        // 2. Crear la configuración del proyecto
        const configData = {
            project_id: project.id,
            allow_re_evaluation: formData.allow_re_evaluation,
            require_evaluator_info: formData.require_evaluator_info,
            evaluation_deadline: formData.evaluation_deadline,
            reminder_days: formData.reminder_days,
            email_notifications: formData.email_notifications
        };

        const { error: configError } = await supabase
            .from('project_configurations')
            .insert([configData]);

        if (configError) {
            // Si falla la configuración, intentar eliminar el proyecto creado
            await supabase.from('projects').delete().eq('id', project.id);
            throw new Error(`Error al crear configuración del proyecto: ${configError.message}`);
        }

        // 3. Obtener el proyecto completo con configuración
        const completeProject = await getProject(project.id);

        return completeProject || project;
    } catch (error) {
        console.error('Error in createProjectFromForm:', error);
        throw error;
    }
};

/**
 * Actualizar un proyecto existente
 */
export const updateProject = async (projectId: string, updates: UpdateProjectData): Promise<Project> => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .update({
                name: updates.name,
                description: updates.description,
                hierarchy_levels: updates.hierarchy_levels,
                status: updates.status,
                start_date: updates.start_date,
                end_date: updates.end_date,
                updated_at: new Date().toISOString()
            })
            .eq('id', projectId)
            .select(`
                id,
                organization_id,
                template_id,
                name,
                description,
                hierarchy_levels,
                status,
                start_date,
                end_date,
                created_by,
                created_at,
                updated_at
            `)
            .single();

        if (error) {
            throw new Error(`Error al actualizar proyecto: ${error.message}`);
        }

        return data as Project;
    } catch (error) {
        console.error('Error in updateProject:', error);
        throw error;
    }
};

/**
 * Actualizar proyecto completo con configuración desde formulario
 */
export const updateProjectFromForm = async (projectId: string, formData: {
    // Datos básicos del proyecto
    name?: string;
    description?: string;
    hierarchy_levels?: number;
    start_date?: string;
    end_date?: string;
    status?: string;

    // Configuraciones
    allow_re_evaluation?: boolean;
    require_evaluator_info?: boolean;
    evaluation_deadline?: string;
    reminder_days?: number[];
    email_notifications?: boolean;
}): Promise<Project> => {
    try {
        // 1. Actualizar el proyecto básico
        const projectUpdates: UpdateProjectData = {
            name: formData.name,
            description: formData.description,
            hierarchy_levels: formData.hierarchy_levels,
            status: formData.status as 'draft' | 'active' | 'completed' | 'archived',
            start_date: formData.start_date,
            end_date: formData.end_date
        };

        const updatedProject = await updateProject(projectId, projectUpdates);

        // 2. Actualizar o crear la configuración del proyecto
        const configData = {
            allow_re_evaluation: formData.allow_re_evaluation,
            require_evaluator_info: formData.require_evaluator_info,
            evaluation_deadline: formData.evaluation_deadline,
            reminder_days: formData.reminder_days,
            email_notifications: formData.email_notifications,
            updated_at: new Date().toISOString()
        };

        // Verificar si ya existe configuración
        const { data: existingConfig } = await supabase
            .from('project_configurations')
            .select('id')
            .eq('project_id', projectId)
            .single();

        if (existingConfig) {
            // Actualizar configuración existente
            const { error: updateError } = await supabase
                .from('project_configurations')
                .update(configData)
                .eq('project_id', projectId);

            if (updateError) {
                throw new Error(`Error al actualizar configuración: ${updateError.message}`);
            }
        } else {
            // Crear nueva configuración
            const { error: insertError } = await supabase
                .from('project_configurations')
                .insert([{
                    ...configData,
                    project_id: projectId
                }]);

            if (insertError) {
                throw new Error(`Error al crear configuración: ${insertError.message}`);
            }
        }

        // 3. Obtener el proyecto completo con configuración actualizada
        const completeProject = await getProject(projectId);

        return completeProject || updatedProject;
    } catch (error) {
        console.error('Error in updateProjectFromForm:', error);
        throw error;
    }
};

/**
 * Eliminar un proyecto
 */
export const deleteProject = async (projectId: string): Promise<void> => {
    try {
        // Verificar si el proyecto tiene equipos o evaluaciones
        const { data: teamsData } = await supabase
            .from('teams')
            .select('id')
            .eq('project_id', projectId)
            .limit(1);

        if (teamsData && teamsData.length > 0) {
            console.error('No se puede eliminar el proyecto porque tiene equipos asociados')

            throw new Error('No se puede eliminar el proyecto porque tiene equipos asociados');
        }

        const { error, } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);
        console.log({ projectId })
        if (error) {
            console.error(error)
            throw new Error(`Error al eliminar proyecto: ${error.message}`);
        }
    } catch (error) {
        console.error('Error in deleteProject:', error);
        throw error;
    }
};

/**
 * Activar un proyecto usando función RPC
 */
export const activateProject = async (projectId: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase.rpc('activate_project', {
            project_uuid: projectId
        });

        if (error) {
            throw new Error(`Error al activar proyecto: ${error.message}`);
        }

        return data as boolean;
    } catch (error) {
        console.error('Error in activateProject:', error);
        throw error;
    }
};

// ============================================================================
// FUNCIONES DE ESTADÍSTICAS
// ============================================================================

/**
 * Obtener estadísticas de un proyecto
 */
export const getProjectStats = async (projectId: string): Promise<ProjectStats> => {
    try {
        // Obtener cantidad de equipos con su tamaño
        const { data: teamsData, error: teamsError } = await supabase
            .from('teams')
            .select('id, team_size')
            .eq('project_id', projectId)
            .eq('is_active', true);

        if (teamsError) {
            console.warn('Error getting teams count:', teamsError);
        }

        // Obtener cantidad total de invitaciones activas del proyecto
        const { data: invitationsData, error: invitationsError } = await supabase
            .from('team_invitations')
            .select('id')
            .in('team_id', teamsData?.map(t => t.id) || [])
            .eq('is_active', true);

        if (invitationsError) {
            console.warn('Error getting invitations count:', invitationsError);
        }

        // Obtener evaluaciones completadas del proyecto
        const { data: evaluationsData, error: evaluationsError } = await supabase
            .from('evaluations')
            .select('id, is_complete')
            .in('team_id', teamsData?.map(t => t.id) || [])
            .eq('is_complete', true);

        if (evaluationsError) {
            console.warn('Error getting evaluations count:', evaluationsError);
        }

        // Calcular número esperado de evaluaciones (tamaño de equipos)
        const expectedEvaluations = teamsData?.reduce((total, team) => total + (team.team_size || 0), 0) || 0;
        const totalInvitations = invitationsData?.length || 0;
        const completedEvaluations = evaluationsData?.length || 0;

        const stats: ProjectStats = {
            total_teams: teamsData?.length || 0,
            total_invitations: totalInvitations,
            completed_evaluations: completedEvaluations,
            completion_rate: 0,
            expected_members: expectedEvaluations
        };

        // Calcular progreso basado en evaluaciones completadas vs esperadas
        if (expectedEvaluations > 0) {
            stats.completion_rate = (completedEvaluations / expectedEvaluations) * 100;
        }

        return stats;
    } catch (error) {
        console.error('Error in getProjectStats:', error);
        // Retornar estadísticas vacías en caso de error
        return {
            total_teams: 0,
            total_invitations: 0,
            completed_evaluations: 0,
            completion_rate: 0,
            expected_members: 0
        };
    }
};

/**
 * Obtener dashboard de métricas del proyecto
 */
export const getProjectDashboard = async (projectId: string) => {
    try {
        const { data, error } = await supabase.rpc('get_project_dashboard', {
            p_project_id: projectId
        });

        if (error) {
            throw new Error(`Error al obtener dashboard del proyecto: ${error.message}`);
        }

        return data;
    } catch (error) {
        console.error('Error in getProjectDashboard:', error);
        throw error;
    }
};

/**
 * Exportar datos de evaluación del proyecto
 */
export const exportProjectData = async (projectId: string) => {
    try {
        const { data, error } = await supabase.rpc('export_evaluation_data', {
            p_project_id: projectId
        });

        if (error) {
            throw new Error(`Error al exportar datos del proyecto: ${error.message}`);
        }

        return data;
    } catch (error) {
        console.error('Error in exportProjectData:', error);
        throw error;
    }
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Validar datos de proyecto antes de crear/actualizar
 */
export const validateProjectData = (projectData: Partial<CreateProjectData | UpdateProjectData>): string[] => {
    const errors: string[] = [];

    if (!projectData.name || projectData.name.trim().length === 0) {
        errors.push('El nombre del proyecto es obligatorio');
    }

    if (projectData.name && projectData.name.length > 100) {
        errors.push('El nombre del proyecto no puede exceder 100 caracteres');
    }

    if (projectData.description && projectData.description.length > 500) {
        errors.push('La descripción no puede exceder 500 caracteres');
    }

    if (projectData.start_date && projectData.end_date) {
        const startDate = new Date(projectData.start_date);
        const endDate = new Date(projectData.end_date);

        if (endDate <= startDate) {
            errors.push('La fecha de finalización debe ser posterior a la fecha de inicio');
        }
    }

    return errors;
};

/**
 * Formatear proyecto para mostrar en UI
 */
export const formatProjectForDisplay = (project: Project) => {
    return {
        ...project,
        displayStatus: getStatusDisplayName(project.status),
        formattedDates: {
            created: project.created_at ? new Date(project.created_at).toLocaleDateString('es-ES') : '',
            start: project.start_date ? new Date(project.start_date).toLocaleDateString('es-ES') : 'No definida',
            end: project.end_date ? new Date(project.end_date).toLocaleDateString('es-ES') : 'No definida'
        }
    };
};

/**
 * Obtener nombre del estado para mostrar
 */
export const getStatusDisplayName = (status: string): string => {
    const statusMap: Record<string, string> = {
        'draft': 'Borrador',
        'active': 'Activo',
        'completed': 'Completado',
        'archived': 'Archivado'
    };

    return statusMap[status] || status;
};