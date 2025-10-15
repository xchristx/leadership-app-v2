// ============================================================================
// HOOK DE PROYECTOS
// ============================================================================
// Hook personalizado para gestionar proyectos con operaciones CRUD reales
// ============================================================================

import { useCallback, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'
import {
    useGetProjectsQuery,
    useGetProjectQuery
} from '../store/api/supabaseApi'
import { useAuth } from './useAuth'
import * as projectService from '../services/projectService'
import type { Project, CreateProjectData, UpdateProjectData } from '../types'

// Resultado de mutación
interface MutationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export function useProjects(organizationId?: string) {
    const { profile } = useAuth()
    const currentOrgId = organizationId || profile?.organization_id

    // Estados para operaciones
    const [isCreating, setIsCreating] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Query para obtener proyectos
    const {
        data: projects = [],
        isLoading,
        isError,
        error,
        refetch
    } = useGetProjectsQuery({
        organizationId: currentOrgId
    }, {
        skip: !currentOrgId
    })

    // Crear proyecto con configuración completa
    const createProject = useCallback(async (projectData: Omit<CreateProjectData, 'organization_id'> & {
        allow_re_evaluation?: boolean;
        require_evaluator_info?: boolean;
        evaluation_deadline?: string;
        reminder_days?: number[];
        email_notifications?: boolean;
    }): Promise<MutationResult<Project>> => {
        if (!currentOrgId) {
            return { success: false, error: 'ID de organización no disponible' }
        }

        setIsCreating(true)
        try {
            const formData = {
                ...projectData,
                organization_id: currentOrgId,
                // Valores por defecto para configuración si no se proporcionan
                allow_re_evaluation: projectData.allow_re_evaluation ?? false,
                require_evaluator_info: projectData.require_evaluator_info ?? true,
                reminder_days: projectData.reminder_days ?? [7, 3, 1],
                email_notifications: projectData.email_notifications ?? true
            }

            const newProject = await projectService.createProjectFromForm(formData)

            // Refetch para actualizar la lista
            await refetch()

            return {
                success: true,
                data: newProject
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear proyecto'
            return {
                success: false,
                error: errorMessage
            }
        } finally {
            setIsCreating(false)
        }
    }, [currentOrgId, refetch])    // Actualizar proyecto
    const updateProject = useCallback(async (id: string, updates: UpdateProjectData): Promise<MutationResult<Project>> => {
        setIsUpdating(true)
        try {
            const updatedProject = await projectService.updateProject(id, updates)

            // Refetch para actualizar la lista
            await refetch()

            return {
                success: true,
                data: updatedProject
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar proyecto'
            return {
                success: false,
                error: errorMessage
            }
        } finally {
            setIsUpdating(false)
        }
    }, [refetch])

    // Eliminar proyecto
    const deleteProject = useCallback(async (id: string): Promise<MutationResult<void>> => {
        setIsDeleting(true)
        try {
            await projectService.deleteProject(id)

            // Refetch para actualizar la lista
            await refetch()

            return {
                success: true
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar proyecto'
            return {
                success: false,
                error: errorMessage
            }
        } finally {
            setIsDeleting(false)
        }
    }, [refetch])

    // Activar proyecto
    const activateProject = useCallback(async (id: string): Promise<MutationResult<boolean>> => {
        try {
            const result = await projectService.activateProject(id)

            // Refetch para actualizar la lista
            await refetch()

            return {
                success: true,
                data: result
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al activar proyecto'
            return {
                success: false,
                error: errorMessage
            }
        }
    }, [refetch])

    // Obtener estadísticas del proyecto
    const getProjectStats = useCallback(async (id: string) => {
        try {
            return await projectService.getProjectStats(id)
        } catch (error) {
            console.error('Error al obtener estadísticas del proyecto:', error)
            return {
                total_teams: 0,
                total_invitations: 0,
                completed_evaluations: 0,
                completion_rate: 0
            }
        }
    }, [])

    // Exportar datos del proyecto
    const exportProjectData = useCallback(async (id: string) => {
        try {
            return await projectService.exportProjectData(id)
        } catch (error) {
            console.error('Error al exportar datos del proyecto:', error)
            throw error
        }
    }, [])

    // Estadísticas derivadas
    const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        draft: projects.filter(p => p.status === 'draft').length,
        archived: projects.filter(p => p.status === 'archived').length
    }

    return {
        // Datos
        projects,
        stats,

        // Estados
        isLoading,
        isError,
        error,
        isCreating,
        isUpdating,
        isDeleting,

        // Acciones CRUD
        createProject,
        updateProject,
        deleteProject,
        activateProject,

        // Acciones auxiliares
        getProjectStats,
        exportProjectData,
        refetch
    }
}

// Hook para proyecto individual con estadísticas
export function useProject(id: string) {
    const [stats, setStats] = useState<projectService.ProjectStats | null>(null)
    const [isLoadingStats, setIsLoadingStats] = useState(false)

    const {
        data: project,
        isLoading,
        isError,
        error,
        refetch
    } = useGetProjectQuery(id, {
        skip: !id
    })

    // Cargar estadísticas del proyecto
    const loadStats = useCallback(async () => {
        if (!id) return

        setIsLoadingStats(true)
        try {
            const projectStats = await projectService.getProjectStats(id)
            setStats(projectStats)
        } catch (error) {
            console.error('Error al cargar estadísticas:', error)
        } finally {
            setIsLoadingStats(false)
        }
    }, [id])

    // Obtener dashboard del proyecto
    const getDashboard = useCallback(async () => {
        if (!id) return null

        try {
            return await projectService.getProjectDashboard(id)
        } catch (error) {
            console.error('Error al obtener dashboard:', error)
            throw error
        }
    }, [id])

    return {
        project,
        stats,
        isLoading: isLoading || isLoadingStats,
        isError,
        error,
        refetch,
        loadStats,
        getDashboard
    }
}

/**
 * Hook para crear un nuevo proyecto con configuración usando RTK Query
 */
export const useCreateProjectMutation = () => {
    return useMutation({
        mutationFn: projectService.createProjectFromForm,
        onSuccess: () => {
            // Invalidar las consultas relacionadas para refrescar los datos
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error) => {
            console.error('Error creating project:', error);
        }
    });
};

/**
 * Hook para actualizar un proyecto con configuración usando RTK Query
 */
export const useUpdateProjectMutation = () => {

    return useMutation({
        mutationFn: ({ projectId, formData }: {
            projectId: string;
            formData: Parameters<typeof projectService.updateProjectFromForm>[1]
        }) => projectService.updateProjectFromForm(projectId, formData),
        onSuccess: (updatedProject) => {
            // Invalidar las consultas relacionadas
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['project', updatedProject.id] });
        },
        onError: (error) => {
            console.error('Error updating project:', error);
        }
    });
};