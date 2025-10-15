// ============================================================================
// SERVICIO DE CONFIGURACIONES DE PROYECTO
// ============================================================================
// Servicio para gestionar configuraciones que afectan las evaluaciones
// ============================================================================

import { supabase } from '../lib/supabase';
import type { ProjectConfiguration } from '../types';

// ============================================================================
// OPERACIONES CRUD DE CONFIGURACIONES
// ============================================================================

/**
 * Obtener configuración de un proyecto
 */
export const getProjectConfiguration = async (projectId: string): Promise<ProjectConfiguration | null> => {
    try {
        const { data, error } = await supabase
            .from('project_configurations')
            .select('*')
            .eq('project_id', projectId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // No encontrado
            }
            throw new Error(`Error al obtener configuración: ${error.message}`);
        }

        return data as ProjectConfiguration;
    } catch (error) {
        console.error('Error in getProjectConfiguration:', error);
        throw error;
    }
};

/**
 * Crear configuración para un proyecto
 */
export const createProjectConfiguration = async (
    projectId: string,
    config: Omit<ProjectConfiguration, 'id' | 'project_id' | 'created_at' | 'updated_at'>
): Promise<ProjectConfiguration> => {
    try {
        const { data, error } = await supabase
            .from('project_configurations')
            .insert([{
                project_id: projectId,
                allow_re_evaluation: config.allow_re_evaluation,
                require_evaluator_info: config.require_evaluator_info,
                evaluation_deadline: config.evaluation_deadline,
                reminder_days: config.reminder_days,
                custom_settings: config.custom_settings,
                email_notifications: config.email_notifications
            }])
            .select()
            .single();

        if (error) {
            throw new Error(`Error al crear configuración: ${error.message}`);
        }

        return data as ProjectConfiguration;
    } catch (error) {
        console.error('Error in createProjectConfiguration:', error);
        throw error;
    }
};

/**
 * Actualizar configuración de un proyecto
 */
export const updateProjectConfiguration = async (
    projectId: string,
    updates: Partial<Omit<ProjectConfiguration, 'id' | 'project_id' | 'created_at' | 'updated_at'>>
): Promise<ProjectConfiguration> => {
    try {
        const { data, error } = await supabase
            .from('project_configurations')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('project_id', projectId)
            .select()
            .single();

        if (error) {
            throw new Error(`Error al actualizar configuración: ${error.message}`);
        }

        return data as ProjectConfiguration;
    } catch (error) {
        console.error('Error in updateProjectConfiguration:', error);
        throw error;
    }
};

// ============================================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================================

/**
 * Validar si una evaluación puede ser realizada según las configuraciones
 */
export const validateEvaluationAccess = async (
    projectId: string,
    evaluatorEmail?: string
): Promise<{
    canEvaluate: boolean;
    reason?: string;
    config: ProjectConfiguration | null;
}> => {
    try {
        const config = await getProjectConfiguration(projectId);

        if (!config) {
            return {
                canEvaluate: true,
                config: null
            };
        }

        // Verificar deadline
        if (config.evaluation_deadline) {
            const deadline = new Date(config.evaluation_deadline);
            const now = new Date();

            if (deadline < now) {
                return {
                    canEvaluate: false,
                    reason: 'El período de evaluación ha terminado',
                    config
                };
            }
        }

        // Verificar re-evaluación si ya existe una evaluación previa
        if (!config.allow_re_evaluation && evaluatorEmail) {
            const { data: existingEvaluations, error } = await supabase
                .from('evaluations')
                .select('id')
                .eq('evaluator_email', evaluatorEmail)
                .eq('team_id', projectId); // Esto necesitaría ser team_id en lugar de project_id

            if (error) {
                console.warn('Error checking existing evaluations:', error);
            } else if (existingEvaluations && existingEvaluations.length > 0) {
                return {
                    canEvaluate: false,
                    reason: 'Ya has completado una evaluación para este proyecto',
                    config
                };
            }
        }

        return {
            canEvaluate: true,
            config
        };
    } catch (error) {
        console.error('Error in validateEvaluationAccess:', error);
        return {
            canEvaluate: false,
            reason: 'Error al validar acceso',
            config: null
        };
    }
};

/**
 * Verificar si se requiere información del evaluador
 */
export const requiresEvaluatorInfo = async (projectId: string): Promise<boolean> => {
    try {
        const config = await getProjectConfiguration(projectId);
        return config?.require_evaluator_info || false;
    } catch (error) {
        console.error('Error checking evaluator info requirement:', error);
        return false;
    }
};

/**
 * Obtener configuración de recordatorios
 */
export const getReminderConfig = async (projectId: string): Promise<{
    enabled: boolean;
    days: number[];
    emailNotifications: boolean;
}> => {
    try {
        const config = await getProjectConfiguration(projectId);

        return {
            enabled: (config?.reminder_days?.length || 0) > 0,
            days: config?.reminder_days || [],
            emailNotifications: config?.email_notifications || false
        };
    } catch (error) {
        console.error('Error getting reminder config:', error);
        return {
            enabled: false,
            days: [],
            emailNotifications: false
        };
    }
};

// ============================================================================
// CONFIGURACIONES POR DEFECTO
// ============================================================================

export const DEFAULT_PROJECT_CONFIGURATION: Omit<ProjectConfiguration, 'id' | 'project_id' | 'created_at' | 'updated_at'> = {
    allow_re_evaluation: false,
    require_evaluator_info: true,
    evaluation_deadline: undefined,
    reminder_days: [7, 3, 1], // Recordar 7, 3 y 1 día antes del deadline
    custom_settings: {},
    email_notifications: true
};

/**
 * Crear configuración por defecto para un proyecto
 */
export const createDefaultConfiguration = async (projectId: string): Promise<ProjectConfiguration> => {
    return createProjectConfiguration(projectId, DEFAULT_PROJECT_CONFIGURATION);
};