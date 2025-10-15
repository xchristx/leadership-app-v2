// ============================================================================
// CONFIGURACIÓN DEL CLIENTE SUPABASE
// ============================================================================
// Cliente de Supabase con tipos TypeScript y configuración personalizada
// Maneja autenticación, queries y funciones RPC
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

// Variables de entorno de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas'
    )
}

// Cliente principal de Supabase con tipos
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    },
    global: {
        headers: {
            'x-client-info': 'leadership-evaluation-app'
        }
    }
})

// ============================================================================
// HELPERS PARA AUTENTICACIÓN
// ============================================================================

// Obtener sesión actual
export const getCurrentSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
}

// Obtener usuario actual
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
}

// Login con email y contraseña
export const signInWithPassword = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
}

// Registro con email y contraseña
export const signUp = async (
    email: string,
    password: string,
    options?: {
        data?: {
            first_name?: string
            last_name?: string
            organization_id?: string
            role?: string
        }
    }
) => {
    return await supabase.auth.signUp({
        email,
        password,
        options: {
            data: options?.data
        }
    })
}

// Logout
export const signOut = async () => {
    return await supabase.auth.signOut()
}

// Actualizar metadata del usuario
export const updateUserMetadata = async (data: {
    organization_id?: string
    role?: string
    first_name?: string
    last_name?: string
}) => {
    return await supabase.auth.updateUser({ data })
}

// ============================================================================
// HELPERS PARA ORGANIZACIONES
// ============================================================================

// Crear organización inicial
export const createInitialOrganization = async (
    orgName: string,
    subdomain: string,
    adminEmail: string,
    adminName: string
) => {
    // TODO: Implement create_initial_organization RPC function
    console.log('Creating initial organization:', {
        org_name: orgName,
        subdomain: subdomain,
        admin_email: adminEmail,
        admin_name: adminName
    })
}

// Obtener organización del usuario actual
export const getUserOrganization = async () => {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .single()

    return { data, error }
}

// ============================================================================
// HELPERS PARA FUNCIONES RPC
// ============================================================================

// Activar proyecto
export const activateProject = async (projectId: string) => {
    return await supabase.rpc('activate_project', {
        project_uuid: projectId
    })
}

// Crear proyecto con configuración
export const createProjectWithConfig = async (params: {
    organizationId: string
    templateId: string
    name: string
    description?: string
    hierarchyLevels?: number
    allowReEvaluation?: boolean
    evaluationDeadline?: string
}) => {
    return await supabase.rpc('create_project_with_config', {
        p_organization_id: params.organizationId,
        p_template_id: params.templateId,
        p_name: params.name,
        p_description: params.description,
        p_hierarchy_levels: params.hierarchyLevels,
        p_allow_re_evaluation: params.allowReEvaluation,
        p_evaluation_deadline: params.evaluationDeadline
    })
}

// Crear equipo con invitaciones
export const createTeamWithInvitations = async (params: {
    projectId: string
    teamName: string
    leaderName: string
    leaderEmail: string
    department?: string
    teamSize?: number
}) => {
    return await supabase.rpc('create_team_with_invitations', {
        p_project_id: params.projectId,
        p_team_name: params.teamName,
        p_leader_name: params.leaderName,
        p_leader_email: params.leaderEmail,
        p_department: params.department,
        p_team_size: params.teamSize
    })
}

// Iniciar sesión de evaluación (sin autenticación)
export const startEvaluationSession = async (
    token: string,
    evaluatorName: string,
    evaluatorEmail: string
) => {
    return await supabase.rpc('start_evaluation_session', {
        p_invitation_token: token,
        p_evaluator_name: evaluatorName,
        p_evaluator_email: evaluatorEmail
    })
}

// Completar evaluación
export const completeEvaluation = async (evaluationId: string) => {
    return await supabase.rpc('complete_evaluation', {
        p_evaluation_id: evaluationId
    })
}

// Obtener datos de invitación (público)
export const getInvitationData = async (token: string) => {
    // TODO: Implement get_invitation_data RPC function
    console.log('Getting invitation data for token:', {
        invitation_token: token
    })
}

// Validar token de invitación
export const validateInvitationToken = async (token: string) => {
    // TODO: Implement is_valid_invitation_token RPC function
    console.log('Validating invitation token:', {
        token: token
    })
}

// Regenerar token de invitación
export const regenerateInvitationToken = async (invitationId: string) => {
    return await supabase.rpc('regenerate_invitation_token', {
        invitation_uuid: invitationId
    })
}

// Obtener dashboard del proyecto
export const getProjectDashboard = async (projectId: string) => {
    return await supabase.rpc('get_project_dashboard', {
        p_project_id: projectId
    })
}

// Obtener resultados por equipo
export const getTeamResults = async (teamId: string) => {
    return await supabase.rpc('get_team_results', {
        p_team_id: teamId
    })
}

// Obtener comparación entre equipos
export const getTeamsComparison = async (projectId: string) => {
    return await supabase.rpc('get_teams_comparison', {
        p_project_id: projectId
    })
}

// Exportar datos de evaluación
export const exportEvaluationData = async (projectId: string) => {
    return await supabase.rpc('export_evaluation_data', {
        p_project_id: projectId
    })
}

// Obtener estadísticas de evaluación
export const getEvaluationStats = async (projectId: string) => {
    return await supabase.rpc('get_evaluation_stats', {
        project_uuid: projectId
    })
}

// ============================================================================
// HELPERS PARA QUERIES COMUNES
// ============================================================================

// Obtener plantillas de organización
export const getQuestionTemplates = async (organizationId?: string) => {
    let query = supabase
        .from('question_templates')
        .select(`
      *,
      questions:questions(
        id,
        text_leader,
        text_collaborator,
        category,
        order_index,
        question_type,
        response_config,
        is_active
      )
    `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    if (organizationId) {
        query = query.eq('organization_id', organizationId)
    }

    return await query
}

// Obtener proyectos con datos relacionados
export const getProjectsWithDetails = async (organizationId?: string) => {
    let query = supabase
        .from('projects')
        .select(`
      *,
      template:question_templates(id, title),
      teams:teams(count),
      configuration:project_configurations(*)
    `)
        .order('created_at', { ascending: false })

    if (organizationId) {
        query = query.eq('organization_id', organizationId)
    }

    return await query
}

// Obtener equipos con invitaciones
export const getTeamsWithInvitations = async (projectId: string) => {
    return await supabase
        .from('teams')
        .select(`
      *,
      invitations:team_invitations(
        id,
        role_type,
        unique_token,
        is_active,
        expires_at,
        current_uses,
        max_uses
      ),
      evaluations:evaluations(count)
    `)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
}

// Obtener evaluaciones de un equipo
export const getTeamEvaluations = async (teamId: string) => {
    return await supabase
        .from('evaluations')
        .select(`
      *,
      responses:evaluation_responses(
        id,
        question_id,
        response_value,
        response_text,
        response_data
      )
    `)
        .eq('team_id', teamId)
        .eq('is_complete', true)
        .order('completed_at', { ascending: false })
}

// Obtener preguntas de una plantilla
export const getTemplateQuestions = async (templateId: string) => {
    return await supabase
        .from('questions')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .order('order_index', { ascending: true })
}

// ============================================================================
// HELPERS PARA SESIONES PÚBLICAS (SIN AUTENTICACIÓN)
// ============================================================================

// Cliente para operaciones públicas (sin auth)
export const supabasePublic = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            headers: {
                'x-client-info': 'leadership-evaluation-app-public'
            }
        }
    }
)

// Guardar respuesta de evaluación (público)
export const saveEvaluationResponse = async (
    evaluationId: string,
    questionId: string,
    response: {
        value?: number
        text?: string
        data?: Record<string, unknown>
        timeSeconds?: number
    }
) => {
    return await supabasePublic
        .from('evaluation_responses')
        .upsert({
            evaluation_id: evaluationId,
            question_id: questionId,
            response_value: response.value,
            response_text: response.text,
            response_data: response.data as Database['public']['Tables']['evaluation_responses']['Insert']['response_data'],
            response_time_seconds: response.timeSeconds
        }, {
            onConflict: 'evaluation_id,question_id'
        })
}

// Obtener progreso de evaluación (público)
export const getEvaluationProgress = async (evaluationId: string) => {
    const { data: responses } = await supabasePublic
        .from('evaluation_responses')
        .select('id')
        .eq('evaluation_id', evaluationId)

    const { data: evaluation } = await supabasePublic
        .from('evaluations')
        .select('completion_percentage')
        .eq('id', evaluationId)
        .single()

    return {
        answered_questions: responses?.length || 0,
        completion_percentage: evaluation?.completion_percentage || 0
    }
}

// ============================================================================
// LISTENERS PARA CAMBIOS EN TIEMPO REAL
// ============================================================================

// Suscribirse a cambios en evaluaciones de un proyecto
export const subscribeToProjectEvaluations = (
    projectId: string,
    callback: (payload: unknown) => void
) => {
    return supabase
        .channel(`project-${projectId}-evaluations`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'evaluations',
                filter: `team_id=in.(select id from teams where project_id=eq.${projectId})`
            },
            callback
        )
        .subscribe()
}

// Suscribirse a cambios en respuestas de una evaluación
export const subscribeToEvaluationResponses = (
    evaluationId: string,
    callback: (payload: unknown) => void
) => {
    return supabase
        .channel(`evaluation-${evaluationId}-responses`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'evaluation_responses',
                filter: `evaluation_id=eq.${evaluationId}`
            },
            callback
        )
        .subscribe()
}

// ============================================================================
// UTILIDADES PARA MANEJO DE ERRORES
// ============================================================================

// Clase de error personalizada para Supabase
export class SupabaseError extends Error {
    public code?: string;
    public details?: unknown;

    constructor(
        message: string,
        code?: string,
        details?: unknown
    ) {
        super(message)
        this.name = 'SupabaseError'
        this.code = code
        this.details = details
    }
}

// Manejar errores de Supabase
export const handleSupabaseError = (error: unknown): SupabaseError => {
    if (!error) return new SupabaseError('Error desconocido')

    const err = error as { code?: string; message?: string }

    switch (err.code) {
        case 'PGRST116':
            return new SupabaseError('Token de invitación inválido o expirado', err.code, error)
        case 'PGRST204':
            return new SupabaseError('No se encontraron datos', err.code, error)
        case '23505':
            return new SupabaseError('Ya existe un registro con esos datos', err.code, error)
        case '42501':
            return new SupabaseError('Sin permisos para realizar esta operación', err.code, error)
        default:
            return new SupabaseError(err.message || 'Error en la base de datos', err.code, error)
    }
}

// Wrapper para queries con manejo de errores
export const safeQuery = async <T>(
    queryFunction: () => Promise<{ data: T; error: unknown }>
): Promise<{ data: T | null; error: SupabaseError | null }> => {
    try {
        const { data, error } = await queryFunction()
        if (error) {
            return { data: null, error: handleSupabaseError(error) }
        }
        return { data, error: null }
    } catch (err) {
        return { data: null, error: handleSupabaseError(err) }
    }
}

export default supabase