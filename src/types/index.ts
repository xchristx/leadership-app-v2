// ============================================================================
// TIPOS DERIVADOS DE SUPABASE Y TIPOS ADICIONALES DEL FRONTEND
// ============================================================================
// Tipos TypeScript para el sistema de evaluación de equipos
// Basados en el esquema de Supabase con extensiones para el frontend
// ============================================================================

import type { Database } from './database.types'

// Re-export de tipos base de Supabase
export type { Database, Tables, TablesInsert, TablesUpdate } from './database.types'

// ============================================================================
// TIPOS DE AUTENTICACIÓN
// ============================================================================

export interface LoginCredentials {
    email: string
    password: string
}

// ============================================================================
// TIPOS DE ENTIDADES PRINCIPALES
// ============================================================================

// Organización con datos adicionales
export interface Organization {
    id: string
    name: string
    subdomain: string
    settings?: Record<string, any>
    created_at: string
    updated_at: string
}

// Usuario con información completa
export interface User {
    id: string
    organization_id: string
    email: string
    role: 'admin' | 'super_admin' | 'user'
    first_name?: string
    last_name?: string
    is_active: boolean
    last_login_at?: string
    created_at: string
    updated_at: string
}

// Plantilla de cuestionario con preguntas
export interface QuestionTemplate {
    id: string
    organization_id: string
    title: string
    description?: string
    version_type: 'leader' | 'collaborator' | 'both'
    is_active: boolean
    created_by?: string
    created_at: string
    updated_at: string
    questions?: Question[]
    _count?: {
        questions: number
        projects: number
    }
}

// Pregunta con configuración de respuesta
export interface Question {
    id: string
    template_id: string
    text_leader: string
    text_collaborator: string
    category?: string
    order_index: number
    question_type: 'likert' | 'text' | 'multiple_choice'
    response_config: {
        scale?: number
        labels?: string[]
        options?: string[]
    }
    is_active: boolean
    created_at: string
    updated_at: string
}

// Proyecto con datos relacionados
export interface Project {
    id: string
    organization_id: string
    template_id: string
    name: string
    description?: string
    hierarchy_levels: 2 | 3
    status: 'draft' | 'active' | 'completed' | 'archived'
    start_date?: string
    end_date?: string
    created_by?: string
    created_at: string
    updated_at: string

    // Relaciones
    template?: QuestionTemplate
    teams?: Team[]
    configuration?: ProjectConfiguration

    // Estadísticas calculadas
    _stats?: {
        total_teams: number
        total_invitations: number
        completed_evaluations: number
        completion_rate: number
        expected_members: number
    }
}

// Configuración de proyecto
export interface ProjectConfiguration {
    id: string
    project_id: string
    allow_re_evaluation: boolean
    require_evaluator_info: boolean
    evaluation_deadline?: string
    reminder_days: number[]
    custom_settings: Record<string, any>
    email_notifications: boolean
    created_at: string
    updated_at: string
}

// Equipo con invitaciones
export interface Team {
    id: string
    project_id: string
    name: string
    team_type?: 'regular' | 'project_leadership'  // Tipo de equipo
    leader_name?: string
    leader_email?: string
    team_size?: number
    is_active: boolean
    created_at: string
    updated_at: string
    department?: string

    // Relaciones
    evaluations?: Evaluation[]
    invitations?: TeamInvitation[]

    // URLs generadas (se generan dinámicamente)
    invitation_urls?: {
        leader?: string
        collaborator?: string
    }

    // Estadísticas
    _stats?: {
        total_evaluations: number
        completed_evaluations: number
        pending_evaluations: number
        completion_rate: number
        total_members: number
    }
}

// Invitación de equipo
export interface TeamInvitation {
    id: string
    team_id: string
    role_type: 'leader' | 'collaborator'
    unique_token: string
    is_active: boolean | null
    expires_at?: string
    max_uses?: number
    current_uses: number
    created_at: string
    updated_at: string
}

// Sesión de invitación temporal
export interface InvitationSession {
    id: string
    invitation_id: string
    session_data: Record<string, any>
    last_activity: string
    expires_at: string
    created_at: string
    updated_at: string
}

// Evaluación completa
export interface Evaluation {
    id: string
    team_id: string
    invitation_id: string
    evaluator_name: string
    evaluator_email: string
    evaluator_role: 'leader' | 'collaborator'
    is_complete: boolean
    completion_percentage: number
    completed_at: string
    evaluator_metadata?: Record<string, any>
    created_at: string
    updated_at: string

    // Relaciones
    responses?: EvaluationResponse[]
    team?: Team


    // Campos calculados para la UI
    team_name?: string
    template_title?: string

    // Estado de la evaluación
    _progress?: {
        total_questions: number
        answered_questions: number
        percentage: number
    }
}

export interface EvaluationWithTeams extends Evaluation {
    teams?: TeamWithProjectName
}

export interface TeamWithProjectName extends Team {
    projects: {
        name?: string
        id: string
    }
}

// Respuesta de evaluación
export interface EvaluationResponse {
    id: string
    evaluation_id: string
    question_id: string
    response_value?: number
    response_text?: string
    response_data?: Record<string, any>
    response_time_seconds?: number
    created_at: string
    updated_at: string

    // Relación con pregunta
    question?: Question
}

// ============================================================================
// TIPOS PARA SISTEMA JSON DE RESPUESTAS
// ============================================================================

// Estructura de una respuesta individual en JSON
export interface JsonResponse {
    value: any // number, string, boolean, etc.
    timestamp: string // ISO string
    response_time_seconds?: number
    metadata?: Record<string, any>
}

// Metadata de la evaluación completa
export interface EvaluationMetadata {
    completion_time_seconds?: number
    device_info?: string
    browser_info?: string
    ip_address?: string
    started_at?: string
    completed_at?: string
    version: string
    [key: string]: any
}

// Estructura completa del JSON de respuestas
export interface ResponsesJsonData {
    responses: Record<string, JsonResponse> // question_id -> response
    metadata: EvaluationMetadata
}

// Tipo para el campo responses_data de la tabla evaluations
export type EvaluationResponsesData = ResponsesJsonData | null

// Helper type para trabajar con respuestas del form
export type FormResponses = Record<string, string | number>

// Tipo para convertir respuestas de form a JSON
export interface ConvertToJsonParams {
    formResponses: FormResponses
    startTime: Date
    endTime: Date
    deviceInfo?: string
    version?: string
}

// ============================================================================
// TIPOS PARA FORMULARIOS Y UI
// ============================================================================

// Formulario para crear/editar plantilla
export interface QuestionTemplateFormData {
    title: string
    description?: string
    version_type: 'leader' | 'collaborator' | 'both'
    questions: QuestionFormData[]
}

// Formulario para crear/editar pregunta
export interface QuestionFormData {
    text_leader: string
    text_collaborator: string
    category?: string
    question_type: 'likert' | 'text' | 'multiple_choice'
    response_config: {
        scale?: number
        labels?: string[]
        options?: string[]
    }
    order_index: number
}

// Formulario para crear/editar proyecto
export interface ProjectFormData {
    template_id: string
    name: string
    description?: string
    hierarchy_levels: 2 | 3
    start_date?: string
    end_date?: string

    // Configuración
    allow_re_evaluation: boolean
    require_evaluator_info: boolean
    evaluation_deadline?: string
    reminder_days: number[]
    email_notifications: boolean
}

// Formulario para crear/editar equipo
export type TeamFormData = Database['public']['Tables']['teams']['Insert']

// Datos del evaluador para iniciar sesión
export interface EvaluatorData {
    name: string
    email: string
    additional_info?: Record<string, any>
}

// ============================================================================
// TIPOS PARA ANÁLISIS Y REPORTES
// ============================================================================

// Métricas del dashboard
export interface DashboardMetrics {
    total_teams: number
    completed_evaluations: number
    response_rate: number
    average_score: number
}

// Resultado por equipo
export interface TeamResult {
    team_name: string
    category?: string
    question_text: string
    avg_leader_score?: number
    avg_collaborator_score?: number
    response_count: number
}

// Comparación entre equipos
export interface TeamComparison {
    team_name: string
    leader_avg_score?: number
    collaborator_avg_score?: number
    total_responses: number
    last_evaluation?: string
}

// Datos de exportación
export interface ExportData {
    team_name: string
    evaluator_name: string
    evaluator_role: 'leader' | 'collaborator'
    question_category?: string
    question_text: string
    response_value?: number
    response_text?: string
    completed_at: string
}

// ============================================================================
// TIPOS PARA ESTADO DE LA APLICACIÓN
// ============================================================================

// Estado de autenticación
export interface AuthState {
    user: User | null
    organization: Organization | null
    isLoading: boolean
    isAuthenticated: boolean
    error?: string
}

// Estado de la evaluación pública
export interface EvaluationState {
    session: {
        evaluation_id?: string
        session_id?: string
        team_name?: string
        role_type?: 'leader' | 'collaborator'
    } | null
    questions: Question[]
    responses: Record<string, any>
    progress: {
        current_question: number
        total_questions: number
        answered_questions: number
        percentage: number
    }
    is_loading: boolean
    error?: string
}

// ============================================================================
// TIPOS PARA API Y HOOKS
// ============================================================================

// Parámetros de consulta comunes
export interface QueryParams {
    page?: number
    limit?: number
    search?: string
    status?: string
    organization_id?: string
    project_id?: string
    team_id?: string
}

// Respuesta paginada
export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
}

// Resultado de mutación
export interface MutationResult<T = any> {
    data?: T
    error?: string
    isLoading: boolean
    isSuccess: boolean
}

// Resultado de hook personalizado
export interface HookResult<T = any> {
    data: T | null
    isLoading: boolean
    error?: string
    refetch?: () => void
}

// ============================================================================
// TIPOS PARA NAVEGACIÓN Y RUTAS
// ============================================================================

// Tipos de rutas
export type RouteType = 'public' | 'protected' | 'admin'

// Parámetros de ruta
export interface RouteParams {
    organizationId?: string
    projectId?: string
    teamId?: string
    templateId?: string
    token?: string
}

// ============================================================================
// TIPOS FALTANTES PARA API
// ============================================================================

// Invitación de proyecto
export interface ProjectInvitation {
    id: string
    project_id: string
    email: string
    role: string
    status: 'pending' | 'accepted' | 'expired'
    token: string
    expires_at?: string
    created_at: string
    updated_at: string
}

// Datos para crear proyecto
export interface CreateProjectData {
    organization_id: string
    template_id: string
    name: string
    description?: string
    hierarchy_levels?: number
    start_date?: string
    end_date?: string
    status?: 'draft' | 'active' | 'completed' | 'archived'
}

// Datos para actualizar proyecto
export interface UpdateProjectData {
    name?: string
    description?: string
    hierarchy_levels?: number
    start_date?: string
    end_date?: string
    status?: 'draft' | 'active' | 'completed' | 'archived'
}

// Datos para crear equipo
export interface CreateTeamData {
    project_id: string
    name: string
    team_type?: 'regular' | 'project_leadership' // Tipo de equipo
    leader_name?: string
    leader_email?: string
    team_size?: number
    is_active?: boolean
}

export interface UpdateTeamData {
    name?: string
    team_type?: 'regular' | 'project_leadership' // Tipo de equipo
    team_size?: number
    leader_name?: string
    leader_email?: string
    is_active?: boolean
}

// Filtros para evaluaciones
export interface EvaluationFilters {
    projectId?: string
    teamId?: string
    status?: string
    evaluatorId?: string
}

// ============================================================================
// ENUMS Y CONSTANTES
// ============================================================================

// Usar tipos literales en lugar de enums para mejor compatibilidad
export const USER_ROLES = {
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
    USER: 'user'
} as const

export const PROJECT_STATUS = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ARCHIVED: 'archived'
} as const

export const QUESTION_TYPES = {
    LIKERT: 'likert',
    TEXT: 'text',
    MULTIPLE_CHOICE: 'multiple_choice'
} as const

export const EVALUATOR_ROLES = {
    LEADER: 'leader',
    COLLABORATOR: 'collaborator'
} as const

export type UserRoleType = typeof USER_ROLES[keyof typeof USER_ROLES]
export type ProjectStatusType = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS]
export type QuestionTypeType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES]
export type EvaluatorRoleType = typeof EVALUATOR_ROLES[keyof typeof EVALUATOR_ROLES]

// Configuraciones por defecto
export const DEFAULT_LIKERT_CONFIG = {
    scale: 5,
    labels: ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo']
}

export const DEFAULT_REMINDER_DAYS = [7, 3, 1]

export const PROJECT_STATUS_COLORS: Record<ProjectStatusType, string> = {
    [PROJECT_STATUS.DRAFT]: '#9e9e9e',
    [PROJECT_STATUS.ACTIVE]: '#4caf50',
    [PROJECT_STATUS.COMPLETED]: '#2196f3',
    [PROJECT_STATUS.ARCHIVED]: '#ff9800'
}

// ============================================================================
// TIPOS AUXILIARES PARA FORMULARIOS
// ============================================================================

// Errores de validación
export interface ValidationErrors {
    [field: string]: string | string[] | ValidationErrors
}

// Estado de formulario
export interface FormState<T = any> {
    values: T
    errors: ValidationErrors
    touched: Record<string, boolean>
    isSubmitting: boolean
    isValid: boolean
}

// Configuración de campo de formulario
export interface FieldConfig {
    name: string
    label: string
    type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date'
    required?: boolean
    options?: Array<{ value: any; label: string }>
    validation?: any // Schema de Yup
    placeholder?: string
    helperText?: string
    multiline?: boolean
    rows?: number
}

// ============================================================================
// TIPOS PARA COMPONENTES ESPECÍFICOS
// ============================================================================

// Props del componente de evaluación
export interface EvaluationFormProps {
    token: string
    onComplete?: (evaluation: Evaluation) => void
    onError?: (error: string) => void
}

// Props del dashboard de proyecto
export interface ProjectDashboardProps {
    projectId: string
    onExport?: () => void
}

// Props del componente de equipo
export interface TeamCardProps {
    team: Team
    onEdit?: (team: Team) => void
    onDelete?: (teamId: string) => void
    onViewResults?: (teamId: string) => void
}

// Props del componente de pregunta
export interface QuestionComponentProps {
    question: Question
    value?: any
    onChange: (questionId: string, value: any) => void
    roleType: 'leader' | 'collaborator'
    disabled?: boolean
}

// ============================================================================
// TIPOS PARA CONFIGURACIÓN DE TEMA Y UI
// ============================================================================

// Configuración de tema personalizada
export interface ThemeConfig {
    mode: 'light' | 'dark'
    primaryColor: string
    secondaryColor: string
    organization?: {
        logo?: string
        colors?: {
            primary: string
            secondary: string
        }
    }
}

// Configuración de tabla/grid
export interface GridConfig<T = any> {
    columns: Array<{
        field: keyof T
        headerName: string
        width?: number
        sortable?: boolean
        filterable?: boolean
        renderCell?: (params: any) => React.ReactNode
    }>
    pageSize: number
    sortModel?: Array<{
        field: keyof T
        sort: 'asc' | 'desc'
    }>
}