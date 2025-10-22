// ============================================================================
// API CON RTK QUERY PARA SUPABASE (VERSIÓN SIMPLIFICADA)
// ============================================================================
// Configuración principal de RTK Query para operaciones básicas CRUD
// ============================================================================

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from '../../lib/supabase'
import type {
    Organization,
    Project,
    Team,
    Evaluation,
    EvaluationWithTeams
} from '../../types'

// Configuración base de RTK Query
export const supabaseApi = createApi({
    reducerPath: 'supabaseApi',

    baseQuery: fetchBaseQuery({
        baseUrl: '/',
        prepareHeaders: async (headers) => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.access_token) {
                headers.set('Authorization', `Bearer ${session.access_token}`)
            }
            return headers
        }
    }),

    tagTypes: ['Organization', 'Project', 'Team', 'Evaluation'],

    endpoints: (builder) => ({

        // ========================================================================
        // ORGANIZACIONES
        // ========================================================================

        getOrganizations: builder.query<Organization[], void>({
            queryFn: async () => {
                try {
                    const { data, error } = await supabase
                        .from('organizations')
                        .select('*')
                        .order('created_at', { ascending: false })

                    if (error) throw error
                    return { data: (data || []) as Organization[] }
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: String(error) } }
                }
            },
            providesTags: ['Organization']
        }),

        // ========================================================================
        // PROYECTOS
        // ========================================================================

        getProjects: builder.query<Project[], { organizationId?: string }>({
            queryFn: async ({ organizationId = '' }) => {
                try {
                    // Importar el servicio para usar getProjectsWithStats
                    const { getProjectsWithStats } = await import('../../services/projectService')

                    if (!organizationId) {
                        return { data: [] }
                    }

                    const data = await getProjectsWithStats(organizationId)
                    return { data }
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: String(error) } }
                }
            },
            providesTags: ['Project']
        }),

        getProject: builder.query<Project, string>({
            queryFn: async (id) => {
                try {
                    const { data, error } = await supabase
                        .from('projects')
                        .select('*')
                        .eq('id', id)
                        .single()

                    if (error) throw error
                    return { data: data as Project }
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: String(error) } }
                }
            },
            providesTags: (_result, _error, id) => [{ type: 'Project', id }]
        }),

        // ========================================================================
        // EQUIPOS
        // ========================================================================

        getTeams: builder.query<Team[], { projectId?: string }>({
            queryFn: async ({ projectId = '' }) => {
                try {
                    // Importar el servicio para usar getTeamsWithStats
                    const { getTeamsWithStats } = await import('../../services/teamService')

                    // Si hay projectId, necesitamos filtrar después ya que getTeamsWithStats no soporta filtro por proyecto
                    // TODO: Mejorar getTeamsWithStats para soportar filtro por proyecto
                    const data = await getTeamsWithStats()

                    // Filtrar por proyecto si se especifica
                    const filteredData = projectId ? data.filter(team => team.project_id === projectId) : data

                    return { data: filteredData }
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: String(error) } }
                }
            },
            providesTags: ['Team']
        }),

        // ========================================================================
        // EVALUACIONES
        // ========================================================================

        getEvaluations: builder.query<EvaluationWithTeams[], { projectId?: string; teamId?: string }>({
            queryFn: async ({ projectId = '', teamId = '' }) => {
                try {
                    let query = supabase
                        .from('evaluations')
                        .select(`
                            *,
                            teams!inner(
                                id,
                                name,
                                projects!inner(
                                    id,
                                    name,
                                    question_templates!inner(
                                        id,
                                        title
                                    )
                                )
                            )
                        `)
                    if (projectId) query = query.eq('project_id', projectId)
                    if (teamId) query = query.eq('team_id', teamId)

                    const { data, error } = await query.order('created_at', { ascending: false })

                    if (error) throw error

                    // Transformar los datos para incluir los campos relacionados
                    const evaluationsWithRelations = (data || []).map((evaluation: Record<string, unknown>) => {
                        const teams = evaluation.teams as {
                            name?: string;
                            projects?: {
                                question_templates?: { title?: string }
                            }
                        } | undefined;

                        return {
                            ...evaluation,
                            team_name: teams?.name || 'Equipo sin nombre',
                            template_title: teams?.projects?.question_templates?.title || 'Template sin título'
                        };
                    });
                    return { data: evaluationsWithRelations as Evaluation[] }
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: String(error) } }
                }
            },
            providesTags: ['Evaluation']
        })
    })
})

// Export de hooks básicos
export const {
    useGetOrganizationsQuery,
    useGetProjectsQuery,
    useGetProjectQuery,
    useGetTeamsQuery,
    useGetEvaluationsQuery
} = supabaseApi