// ============================================================================
// SERVICIO DE EVALUACIONES COMPLETO
// ============================================================================
// Servicio para gestionar evaluaciones con validación de duplicados y edición
// ============================================================================

import { supabase } from '../lib/supabase';
import type { Evaluation, EvaluationResponse, Question } from '../types';
import type { Json } from '../types/database.types';

// ============================================================================
// TIPOS ESPECÍFICOS DEL SERVICIO
// ============================================================================

export interface EvaluationData {
    team_id: string;
    invitation_id: string;
    evaluator_name: string;
    evaluator_email: string;
    evaluator_role: 'leader' | 'collaborator';
    evaluator_metadata?: Record<string, unknown>;
}

// Importar tipos para sistema JSON
import type {
    ResponsesJsonData,
    JsonResponse,
    EvaluationMetadata,
    FormResponses,
    ConvertToJsonParams
} from '../types';

export interface EvaluationWithDetails {
    evaluation: Evaluation;
    responses: EvaluationResponse[];
    questions: Question[];
    project_configuration?: {
        allow_re_evaluation: boolean;
        require_evaluator_info: boolean;
        evaluation_deadline?: string;
    };
}

export interface EmailCheckResult {
    exists: boolean;
    evaluation?: Evaluation;
    canEdit: boolean;
    message?: string;
}

// ============================================================================
// VALIDACIONES Y VERIFICACIONES
// ============================================================================

/**
 * Verificar si un email ya realizó una evaluación en un equipo
 */
export const checkEmailEvaluationExists = async (
    teamId: string,
    email: string
): Promise<EmailCheckResult> => {
    try {
        console.log(`Verificando email ${email} en equipo ${teamId}`);

        const { data: evaluation, error } = await supabase
            .from('evaluations')
            .select(`
        id,
        evaluator_email,
        evaluator_name,
        evaluator_role,
        is_complete,
        completion_percentage,
        created_at,
        updated_at,
        completed_at,
        team_id,
        teams!inner(
          project_id,
          projects!inner(
            id,
            name,
            project_configurations(
              allow_re_evaluation,
              require_evaluator_info,
              evaluation_deadline
            )
          )
        )
      `)
            .eq('team_id', teamId)
            .eq('evaluator_email', email.toLowerCase().trim())
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No se encontró evaluación - puede proceder
                return { exists: false, canEdit: false };
            }
            throw new Error(`Error al verificar email: ${error.message}`);
        }

        // Verificar si se permite re-evaluación
        const evalWithRelations = evaluation as Record<string, unknown>;
        const teams = evalWithRelations?.teams as Record<string, unknown>;
        const projects = teams?.projects as Record<string, unknown>;
        const configData = projects?.project_configurations as Record<string, unknown>;
        const canEdit = configData?.allow_re_evaluation === true;

        let message = 'Ya completaste una evaluación con este email.';
        if (canEdit) {
            message += ' Puedes editarla si es necesario.';
        } else {
            message += ' No está permitido modificarla en este proyecto.';
        }

        return {
            exists: true,
            evaluation: evaluation as unknown as Evaluation,
            canEdit,
            message
        };
    } catch (error) {
        console.error('Error in checkEmailEvaluationExists:', error);
        throw error;
    }
};

/**
 * Verificar si un proyecto permite edición de evaluaciones
 */
export const checkProjectConfiguration = async (projectId: string) => {
    try {
        const { data: config, error } = await supabase
            .from('project_configurations')
            .select('allow_re_evaluation, require_evaluator_info, evaluation_deadline')
            .eq('project_id', projectId)
            .single();

        if (error) {
            console.warn('No se encontró configuración del proyecto:', error);
            return {
                allow_re_evaluation: false,
                require_evaluator_info: true,
                evaluation_deadline: null
            };
        }

        return config;
    } catch (error) {
        console.error('Error in checkProjectConfiguration:', error);
        throw error;
    }
};

// ============================================================================
// OBTENER DATOS DE EVALUACIONES
// ============================================================================

/**
 * Obtener evaluación existente por email y equipo (para edición)
 */
export const getExistingEvaluation = async (
    teamId: string,
    email: string
): Promise<EvaluationWithDetails | null> => {
    try {
        // 1. Obtener evaluación con datos del proyecto
        const { data: evaluation, error: evalError } = await supabase
            .from('evaluations')
            .select(`
        *,
        teams!inner(
          id,
          name,
          project_id,
          projects!inner(
            id,
            name,
            template_id,
            project_configurations(
              allow_re_evaluation,
              require_evaluator_info,
              evaluation_deadline
            )
          )
        )
      `)
            .eq('team_id', teamId)
            .eq('evaluator_email', email.toLowerCase().trim())
            .single();

        if (evalError || !evaluation) {
            return null;
        }

        // 2. Obtener respuestas existentes
        const { data: responses, error: responsesError } = await supabase
            .from('evaluation_responses')
            .select('*')
            .eq('evaluation_id', evaluation.id)
            .order('created_at');

        if (responsesError) {
            console.warn('Error al obtener respuestas:', responsesError);
        }

        // 3. Obtener preguntas del template
        const evalWithRelations = evaluation as Record<string, unknown>;
        const teams = evalWithRelations?.teams as Record<string, unknown>;
        const projects = teams?.projects as Record<string, unknown>;
        const templateId = projects?.template_id as string;
        if (!templateId) {
            throw new Error('No se encontró template para el proyecto');
        }

        const { data: questions, error: questionsError } = await supabase
            .from('questions')
            .select('*')
            .eq('template_id', templateId)
            .eq('is_active', true)
            .order('order_index');

        if (questionsError) {
            console.warn('Error al obtener preguntas:', questionsError);
        }

        const evalWithRelations2 = evaluation as Record<string, unknown>;
        const teams2 = evalWithRelations2?.teams as Record<string, unknown>;
        const projects2 = teams2?.projects as Record<string, unknown>;
        const projectConfig = projects2?.project_configurations as Record<string, unknown>;

        return {
            evaluation: evaluation as unknown as Evaluation,
            responses: (responses || []) as EvaluationResponse[],
            questions: (questions || []) as Question[],
            project_configuration: {
                allow_re_evaluation: projectConfig?.allow_re_evaluation === true,
                require_evaluator_info: projectConfig?.require_evaluator_info === true,
                evaluation_deadline: projectConfig?.evaluation_deadline as string | undefined
            }
        };
    } catch (error) {
        console.error('Error in getExistingEvaluation:', error);
        throw error;
    }
};

/**
 * Obtener evaluaciones de un equipo
 */
export const getTeamEvaluations = async (teamId: string): Promise<Evaluation[]> => {
    try {
        const { data, error } = await supabase
            .from('evaluations')
            .select(`
        *,
        evaluation_responses(count)
      `)
            .eq('team_id', teamId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Error al obtener evaluaciones del equipo: ${error.message}`);
        }

        return (data || []) as Evaluation[];
    } catch (error) {
        console.error('Error in getTeamEvaluations:', error);
        throw error;
    }
};

// ============================================================================
// CREAR Y ACTUALIZAR EVALUACIONES
// ============================================================================

/**
 * Crear nueva evaluación (OBSOLETO - usar createEvaluationWithJson)
 * @deprecated Usar createEvaluationWithJson para mejor performance
 */
export const createEvaluation = async (
    evaluationData: EvaluationData,
    responses: Record<string, string | number>
): Promise<Evaluation> => {
    try {
        console.log('Creando nueva evaluación para:', evaluationData.evaluator_email);

        // 1. Crear evaluación
        const { data: evaluation, error: evaluationError } = await supabase
            .from('evaluations')
            .insert({
                team_id: evaluationData.team_id,
                invitation_id: evaluationData.invitation_id,
                evaluator_name: evaluationData.evaluator_name,
                evaluator_email: evaluationData.evaluator_email.toLowerCase().trim(),
                evaluator_role: evaluationData.evaluator_role,
                is_complete: true,
                completion_percentage: 100,
                completed_at: new Date().toISOString(),
                evaluator_metadata: evaluationData.evaluator_metadata as Record<string, string | number | boolean> || null
            })
            .select()
            .single();

        if (evaluationError) {
            throw new Error(`Error al crear evaluación: ${evaluationError.message}`);
        }

        // 2. Crear respuestas
        await createEvaluationResponses(evaluation.id, responses);

        console.log('Evaluación creada exitosamente:', evaluation.id);
        return evaluation as Evaluation;
    } catch (error) {
        console.error('Error in createEvaluation:', error);
        throw error;
    }
};

/**
 * Actualizar evaluación existente (OBSOLETO - usar updateEvaluationWithJson)
 * @deprecated Usar updateEvaluationWithJson para mejor performance
 */
export const updateEvaluation = async (
    evaluationId: string,
    responses: Record<string, string | number>,
    evaluatorInfo?: {
        name: string;
        email: string;
        additionalInfo?: string
    }
): Promise<void> => {
    try {
        console.log('Actualizando evaluación:', evaluationId);

        // 1. Actualizar información del evaluador si se proporciona
        if (evaluatorInfo) {
            const { error: updateError } = await supabase
                .from('evaluations')
                .update({
                    evaluator_name: evaluatorInfo.name,
                    evaluator_email: evaluatorInfo.email.toLowerCase().trim(),
                    evaluator_metadata: {
                        additional_info: evaluatorInfo.additionalInfo || '',
                        last_updated: new Date().toISOString()
                    },
                    completion_percentage: 100,
                    is_complete: true,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', evaluationId);

            if (updateError) {
                throw new Error(`Error al actualizar evaluación: ${updateError.message}`);
            }
        }

        // 2. Eliminar respuestas existentes y crear nuevas
        await updateEvaluationResponses(evaluationId, responses);

        console.log('Evaluación actualizada exitosamente:', evaluationId);
    } catch (error) {
        console.error('Error in updateEvaluation:', error);
        throw error;
    }
};

/**
 * Eliminar evaluación (soft delete)
 */
export const deleteEvaluation = async (evaluationId: string): Promise<void> => {
    try {
        // Marcar como incompleta en lugar de eliminar
        const { error } = await supabase
            .from('evaluations')
            .update({
                is_complete: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', evaluationId);

        if (error) {
            throw new Error(`Error al eliminar evaluación: ${error.message}`);
        }

        console.log('Evaluación eliminada (soft delete):', evaluationId);
    } catch (error) {
        console.error('Error in deleteEvaluation:', error);
        throw error;
    }
};

// ============================================================================
// GESTIÓN DE RESPUESTAS
// ============================================================================

/**
 * Crear respuestas de evaluación (OBSOLETO - parte del sistema JSON)
 * @deprecated Sistema JSON almacena respuestas directamente en evaluations.responses_data
 */
export const createEvaluationResponses = async (
    evaluationId: string,
    responses: Record<string, string | number>
): Promise<void> => {
    try {
        if (Object.keys(responses).length === 0) {
            throw new Error('No hay respuestas para guardar');
        }

        const responseData = Object.entries(responses).map(([questionId, value]) => ({
            evaluation_id: evaluationId,
            question_id: questionId,
            response_value: typeof value === 'number' ? value : null,
            response_text: typeof value === 'string' ? value : null,
            response_data: typeof value === 'object' && value !== null ? value : null,
        }));

        const { error } = await supabase
            .from('evaluation_responses')
            .insert(responseData);

        if (error) {
            throw new Error(`Error al guardar respuestas: ${error.message}`);
        }

        console.log(`${responseData.length} respuestas guardadas para evaluación ${evaluationId}`);
    } catch (error) {
        console.error('Error in createEvaluationResponses:', error);
        throw error;
    }
};

/**
 * Actualizar respuestas de evaluación (OBSOLETO - parte del sistema JSON)
 * @deprecated Sistema JSON actualiza respuestas directamente en evaluations.responses_data
 */
export const updateEvaluationResponses = async (
    evaluationId: string,
    responses: Record<string, string | number>
): Promise<void> => {
    try {
        // 1. Eliminar respuestas existentes
        const { error: deleteError } = await supabase
            .from('evaluation_responses')
            .delete()
            .eq('evaluation_id', evaluationId);

        if (deleteError) {
            throw new Error(`Error al eliminar respuestas previas: ${deleteError.message}`);
        }

        // 2. Crear nuevas respuestas
        await createEvaluationResponses(evaluationId, responses);

        console.log('Respuestas actualizadas exitosamente para evaluación:', evaluationId);
    } catch (error) {
        console.error('Error in updateEvaluationResponses:', error);
        throw error;
    }
};

// ============================================================================
// ESTADÍSTICAS Y ANÁLISIS
// ============================================================================

/**
 * Obtener estadísticas de evaluación por equipo
 */
export const getEvaluationStats = async (teamId: string) => {
    try {
        const { data: stats, error } = await supabase
            .from('evaluations')
            .select(`
        id,
        is_complete,
        evaluator_role,
        completion_percentage,
        created_at,
        completed_at
      `)
            .eq('team_id', teamId);

        if (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }

        const total = stats.length;
        const completed = stats.filter(e => e.is_complete).length;
        const leaders = stats.filter(e => e.evaluator_role === 'leader').length;
        const collaborators = stats.filter(e => e.evaluator_role === 'collaborator').length;

        return {
            total_evaluations: total,
            completed_evaluations: completed,
            pending_evaluations: total - completed,
            completion_rate: total > 0 ? (completed / total) * 100 : 0,
            leaders_count: leaders,
            collaborators_count: collaborators,
            last_evaluation: stats.length > 0 ? stats[0].completed_at : null
        };
    } catch (error) {
        console.error('Error in getEvaluationStats:', error);
        throw error;
    }
};

/**
 * Convertir respuestas de objetos a mapa para el formulario
 */
export const convertResponsesForForm = (responses: EvaluationResponse[]): Record<string, string | number> => {
    const formResponses: Record<string, string | number> = {};

    responses.forEach((response) => {
        if (response.response_value !== null && response.response_value !== undefined) {
            formResponses[response.question_id] = response.response_value;
        } else if (response.response_text !== null && response.response_text !== undefined) {
            formResponses[response.question_id] = response.response_text;
        }
    });

    return formResponses;
};

// ============================================================================
// UTILIDADES DE VALIDACIÓN
// ============================================================================

/**
 * Validar fecha límite de evaluación
 */
export const validateEvaluationDeadline = (deadline?: string): { isValid: boolean; message?: string } => {
    if (!deadline) {
        return { isValid: true };
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();

    if (deadlineDate < now) {
        return {
            isValid: false,
            message: `El período de evaluación terminó el ${deadlineDate.toLocaleDateString()}`
        };
    }

    return { isValid: true };
};

/**
 * Validar formato de email
 */
export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
        return { isValid: false, message: 'El email es requerido' };
    }

    if (!emailRegex.test(email)) {
        return { isValid: false, message: 'Formato de email inválido' };
    }

    return { isValid: true };
};

/**
 * Validar que haya suficientes respuestas
 */
export const validateResponses = (
    responses: Record<string, string | number>,
    minResponses: number = 1
): { isValid: boolean; message?: string } => {
    const responseCount = Object.keys(responses).length;

    if (responseCount < minResponses) {
        return {
            isValid: false,
            message: `Debes responder al menos ${minResponses} pregunta${minResponses > 1 ? 's' : ''}`
        };
    }

    return { isValid: true };
};

// ============================================================================
// SISTEMA JSON DE RESPUESTAS (NUEVO)
// ============================================================================

/**
 * Convertir respuestas del formulario a formato JSON optimizado
 */
export const convertFormResponsesToJson = (params: ConvertToJsonParams): ResponsesJsonData => {
    const { formResponses, startTime, endTime, deviceInfo, version = '1.0' } = params;

    const responses: Record<string, JsonResponse> = {};
    const currentTime = new Date().toISOString();

    // Convertir cada respuesta
    Object.entries(formResponses).forEach(([questionId, value]) => {
        responses[questionId] = {
            value,
            timestamp: currentTime,
            response_time_seconds: Math.round((endTime.getTime() - startTime.getTime()) / 1000),
            metadata: {
                question_order: Object.keys(formResponses).indexOf(questionId) + 1
            }
        };
    });

    // Crear metadata de la evaluación
    const metadata: EvaluationMetadata = {
        completion_time_seconds: Math.round((endTime.getTime() - startTime.getTime()) / 1000),
        device_info: deviceInfo || 'unknown',
        browser_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        started_at: startTime.toISOString(),
        completed_at: endTime.toISOString(),
        version,
        total_questions: Object.keys(formResponses).length
    };

    return {
        responses,
        metadata
    };
};

/**
 * Convertir JSON de respuestas de vuelta al formato del formulario
 */
export const convertJsonToFormResponses = (jsonData: ResponsesJsonData | null): FormResponses => {
    if (!jsonData || !jsonData.responses) {
        return {};
    }

    const formResponses: FormResponses = {};

    Object.entries(jsonData.responses).forEach(([questionId, responseData]) => {
        formResponses[questionId] = responseData.value;
    });

    return formResponses;
};

/**
 * Crear nueva evaluación usando sistema JSON
 */
export const createEvaluationWithJson = async (
    evaluationData: EvaluationData,
    responses: FormResponses,
    startTime: Date,
    deviceInfo?: string
): Promise<Evaluation> => {
    try {
        console.log('Creando nueva evaluación con sistema JSON para:', evaluationData.evaluator_email);

        const endTime = new Date();

        // Convertir respuestas a formato JSON
        const responsesJsonData = convertFormResponsesToJson({
            formResponses: responses,
            startTime,
            endTime,
            deviceInfo,
            version: '2.0'
        });

        // Crear evaluación con campo JSON
        const { data: evaluation, error: evaluationError } = await supabase
            .from('evaluations')
            .insert({
                team_id: evaluationData.team_id,
                invitation_id: evaluationData.invitation_id,
                evaluator_name: evaluationData.evaluator_name,
                evaluator_email: evaluationData.evaluator_email.toLowerCase().trim(),
                evaluator_role: evaluationData.evaluator_role,
                is_complete: true,
                completion_percentage: 100,
                completed_at: endTime.toISOString(),
                evaluator_metadata: evaluationData.evaluator_metadata as Record<string, string | number | boolean> || null,
                responses_data: responsesJsonData as unknown as Json // Usar tipo Json de Supabase
            })
            .select()
            .single();

        if (evaluationError) {
            throw new Error(`Error al crear evaluación: ${evaluationError.message}`);
        }

        // Ya no creamos respuestas individuales - solo usamos sistema JSON
        console.log('Evaluación creada exitosamente con sistema JSON (solo JSON):', evaluation.id);
        return evaluation as Evaluation;
    } catch (error) {
        console.error('Error in createEvaluationWithJson:', error);
        throw error;
    }
};

/**
 * Actualizar evaluación usando sistema JSON
 */
export const updateEvaluationWithJson = async (
    evaluationId: string,
    responses: FormResponses,
    evaluatorInfo?: {
        name: string;
        email: string;
        additionalInfo?: string;
    },
    startTime?: Date,
    deviceInfo?: string
): Promise<void> => {
    try {
        console.log('Actualizando evaluación con sistema JSON:', evaluationId);

        const endTime = new Date();
        const actualStartTime = startTime || new Date(Date.now() - 5 * 60 * 1000); // 5 minutos atrás por defecto

        // Convertir respuestas a formato JSON
        const responsesJsonData = convertFormResponsesToJson({
            formResponses: responses,
            startTime: actualStartTime,
            endTime,
            deviceInfo,
            version: '2.0'
        });

        // Actualizar evaluación
        const updateData: Record<string, unknown> = {
            completion_percentage: 100,
            is_complete: true,
            completed_at: endTime.toISOString(),
            updated_at: endTime.toISOString(),
            responses_data: responsesJsonData as unknown as Json
        };

        if (evaluatorInfo) {
            updateData.evaluator_name = evaluatorInfo.name;
            updateData.evaluator_email = evaluatorInfo.email.toLowerCase().trim();
            updateData.evaluator_metadata = {
                additional_info: evaluatorInfo.additionalInfo || '',
                last_updated: endTime.toISOString()
            };
        }

        const { error: updateError } = await supabase
            .from('evaluations')
            .update(updateData)
            .eq('id', evaluationId);

        if (updateError) {
            throw new Error(`Error al actualizar evaluación: ${updateError.message}`);
        }

        // Ya no actualizamos respuestas individuales - solo usamos sistema JSON
        console.log('Evaluación actualizada exitosamente con sistema JSON (solo JSON):', evaluationId);
    } catch (error) {
        console.error('Error in updateEvaluationWithJson:', error);
        throw error;
    }
};

/**
 * Obtener evaluación existente usando sistema JSON
 */
export const getExistingEvaluationWithJson = async (
    teamId: string,
    email: string
): Promise<{
    evaluation: Evaluation;
    responses: FormResponses;
    canEdit: boolean;
    metadata?: EvaluationMetadata;
} | null> => {
    try {
        const { data: evaluation, error: evalError } = await supabase
            .from('evaluations')
            .select(`
                *,
                teams!inner(
                    id,
                    name,
                    project_id,
                    projects!inner(
                        id,
                        name,
                        template_id,
                        project_configurations(
                            allow_re_evaluation,
                            require_evaluator_info,
                            evaluation_deadline
                        )
                    )
                )
            `)
            .eq('team_id', teamId)
            .eq('evaluator_email', email.toLowerCase().trim())
            .single();

        if (evalError || !evaluation) {
            return null;
        }

        const evalWithRelations = evaluation as Record<string, unknown>;
        const teams = evalWithRelations?.teams as Record<string, unknown>;
        const projects = teams?.projects as Record<string, unknown>;
        const projectConfig = projects?.project_configurations as Record<string, unknown>;
        const canEdit = projectConfig?.allow_re_evaluation === true;

        // Intentar obtener respuestas del campo JSON primero
        let responses: FormResponses = {};
        let metadata: EvaluationMetadata | undefined;

        if (evaluation.responses_data) {
            try {
                const jsonData = typeof evaluation.responses_data === 'string'
                    ? JSON.parse(evaluation.responses_data) as ResponsesJsonData
                    : evaluation.responses_data as unknown as ResponsesJsonData;
                responses = convertJsonToFormResponses(jsonData);
                metadata = jsonData.metadata;
            } catch (error) {
                console.warn('Error parsing JSON responses_data, falling back to individual responses:', error);
            }
        }

        if (Object.keys(responses).length === 0) {
            // Fallback: obtener respuestas de tabla individual (SOLO para evaluaciones migradas sin JSON)
            console.warn(`Evaluación ${evaluation.id} no tiene datos JSON, usando fallback a evaluation_responses`);
            const { data: individualResponses } = await supabase
                .from('evaluation_responses')
                .select('*')
                .eq('evaluation_id', evaluation.id);

            if (individualResponses) {
                responses = convertResponsesForForm(individualResponses as EvaluationResponse[]);
                metadata = {
                    version: '1.0',
                    fallback_used: true,
                    fallback_timestamp: new Date().toISOString()
                } as EvaluationMetadata;
            }
        }

        return {
            evaluation: evaluation as unknown as Evaluation,
            responses,
            canEdit,
            metadata
        };
    } catch (error) {
        console.error('Error in getExistingEvaluationWithJson:', error);
        throw error;
    }
};