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
    Evaluation
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
                    let query = supabase
                        .from('projects')
                        .select('*')

                    if (organizationId) {
                        query = query.eq('organization_id', organizationId)
                    }

                    const { data, error } = await query.order('created_at', { ascending: false })

                    if (error) throw error
                    return { data: (data || []) as Project[] }
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
                    let query = supabase
                        .from('teams')
                        .select('*')

                    if (projectId) {
                        query = query.eq('project_id', projectId)
                    }

                    const { data, error } = await query.order('created_at', { ascending: false })

                    if (error) throw error
                    return { data: (data || []) as Team[] }
                } catch (error) {
                    return { error: { status: 'FETCH_ERROR', error: String(error) } }
                }
            },
            providesTags: ['Team']
        }),

        // ========================================================================
        // EVALUACIONES
        // ========================================================================

        getEvaluations: builder.query<Evaluation[], { projectId?: string; teamId?: string }>({
            queryFn: async ({ projectId = '', teamId = '' }) => {
                try {
                    let query = supabase
                        .from('evaluations')
                        .select('*')

                    if (projectId) query = query.eq('project_id', projectId)
                    if (teamId) query = query.eq('team_id', teamId)

                    const { data, error } = await query.order('created_at', { ascending: false })

                    if (error) throw error
                    return { data: (data || []) as Evaluation[] }
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