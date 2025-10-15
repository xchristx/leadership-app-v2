// ============================================================================
// HOOK DE EQUIPOS
// ============================================================================
// Hook personalizado para gestionar equipos con operaciones CRUD reales
// ============================================================================

import { useState, useCallback, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'
import {
    useGetTeamsQuery
} from '../store/api/supabaseApi'
import { useAuth } from './useAuth'
import * as teamService from '../services/teamService'
import type { Team, CreateTeamData, UpdateTeamData, TeamInvitation } from '../types'
import type { TeamStats, TeamDashboard, CreateTeamFormData } from '../services/teamService'

// Resultado de mutación
interface MutationResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export function useTeams(organizationId?: string) {
    const { profile } = useAuth()
    const currentOrgId = organizationId || profile?.organization_id

    // Estados para operaciones
    const [isCreating, setIsCreating] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Query para obtener equipos
    const {
        data: teams = [],
        isLoading,
        isError,
        error,
        refetch
    } = useGetTeamsQuery({}, {
        skip: !currentOrgId
    })

    // Crear equipo
    const createTeam = useCallback(async (teamData: CreateTeamData): Promise<MutationResult<Team>> => {
        setIsCreating(true)
        try {
            const newTeam = await teamService.createTeam(teamData)

            // Refetch para actualizar la lista
            await refetch()

            return {
                success: true,
                data: newTeam
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear equipo'
            return {
                success: false,
                error: errorMessage
            }
        } finally {
            setIsCreating(false)
        }
    }, [refetch])

    // Crear equipo con invitaciones automáticas
    const createTeamWithInvitations = useCallback(async (teamData: CreateTeamFormData): Promise<MutationResult<Team>> => {
        setIsCreating(true)
        try {
            const newTeam = await teamService.createTeamWithInvitations(teamData)

            // Refetch para actualizar la lista
            await refetch()

            return {
                success: true,
                data: newTeam
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear equipo con invitaciones'
            return {
                success: false,
                error: errorMessage
            }
        } finally {
            setIsCreating(false)
        }
    }, [refetch])

    // Actualizar equipo
    const updateTeam = useCallback(async (id: string, updates: UpdateTeamData): Promise<MutationResult<Team>> => {
        setIsUpdating(true)
        try {
            const updatedTeam = await teamService.updateTeam(id, updates)

            // Refetch para actualizar la lista
            await refetch()

            return {
                success: true,
                data: updatedTeam
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar equipo'
            return {
                success: false,
                error: errorMessage
            }
        } finally {
            setIsUpdating(false)
        }
    }, [refetch])

    // Eliminar equipo
    const deleteTeam = useCallback(async (id: string): Promise<MutationResult<void>> => {
        setIsDeleting(true)
        try {
            console.log(`Hook: Iniciando eliminación del equipo ${id}`)

            await teamService.deleteTeam(id)

            console.log(`Hook: Equipo ${id} eliminado exitosamente`)

            // Invalidar y refetch para actualizar la lista
            queryClient.invalidateQueries({ queryKey: ['teams'] })
            await refetch()

            return {
                success: true
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar equipo'
            console.error(`Hook: Error al eliminar equipo ${id}:`, errorMessage)

            return {
                success: false,
                error: errorMessage
            }
        } finally {
            setIsDeleting(false)
        }
    }, [refetch])

    // Obtener estadísticas del equipo
    const getTeamStats = useCallback(async (id: string) => {
        try {
            return await teamService.getTeamStats(id)
        } catch (error) {
            console.error('Error al obtener estadísticas del equipo:', error)
            return {
                completed_evaluations: 0,
                pending_evaluations: 0,
                completion_rate: 0,
                total_members: 0
            }
        }
    }, [])

    // Obtener dashboard del equipo
    const getTeamDashboard = useCallback(async (id: string) => {
        try {
            return await teamService.getTeamDashboard(id)
        } catch (error) {
            console.error('Error al obtener dashboard del equipo:', error)
            throw error
        }
    }, [])

    // Estadísticas derivadas
    const stats = {
        total: teams.length,
        active: teams.filter(t => t.is_active).length,
        inactive: teams.filter(t => !t.is_active).length,
        by_project: teams.reduce((acc, team) => {
            const projectName = team.project_id || 'Sin proyecto'
            acc[projectName] = (acc[projectName] || 0) + 1
            return acc
        }, {} as Record<string, number>)
    }

    return {
        // Datos
        teams,
        stats,

        // Estados
        isLoading,
        isError,
        error,
        isCreating,
        isUpdating,
        isDeleting,

        // Acciones CRUD
        createTeam,
        createTeamWithInvitations,
        updateTeam,
        deleteTeam,

        // Acciones auxiliares
        getTeamStats,
        getTeamDashboard,
        refetch
    }
}

// Hook para equipo individual con estadísticas
export function useTeam(id: string) {
    const [stats, setStats] = useState<TeamStats | null>(null)
    const [dashboard, setDashboard] = useState<TeamDashboard | null>(null)
    const [isLoadingStats, setIsLoadingStats] = useState(false)
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)

    const [team, setTeam] = useState<Team | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isError, setIsError] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const refetch = useCallback(async () => {
        if (!id) return

        setIsLoading(true)
        setIsError(false)
        setError(null)
        try {
            const teamData = await teamService.getTeam(id)
            setTeam(teamData)
        } catch (err) {
            setIsError(true)
            setError(err as Error)
        } finally {
            setIsLoading(false)
        }
    }, [id])

    useEffect(() => {
        refetch()
    }, [refetch])

    // Cargar estadísticas del equipo
    const loadStats = useCallback(async () => {
        if (!id) return

        setIsLoadingStats(true)
        try {
            const teamStats = await teamService.getTeamStats(id)
            setStats(teamStats)
        } catch (error) {
            console.error('Error al cargar estadísticas:', error)
        } finally {
            setIsLoadingStats(false)
        }
    }, [id])

    // Cargar dashboard del equipo
    const loadDashboard = useCallback(async () => {
        if (!id) return

        setIsLoadingDashboard(true)
        try {
            const teamDashboard = await teamService.getTeamDashboard(id)
            setDashboard(teamDashboard)
        } catch (error) {
            console.error('Error al cargar dashboard:', error)
        } finally {
            setIsLoadingDashboard(false)
        }
    }, [id])

    return {
        team,
        stats,
        dashboard,
        isLoading: isLoading || isLoadingStats || isLoadingDashboard,
        isError,
        error,
        refetch,
        loadStats,
        loadDashboard
    }
}

// ============================================================================
// HOOKS DE INVITACIONES
// ============================================================================

/**
 * Hook para gestionar invitaciones de equipo
 */
export function useTeamInvitations(teamId: string) {
    const [invitations, setInvitations] = useState<TeamInvitation[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isError, setIsError] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    // Cargar invitaciones del equipo
    const loadInvitations = useCallback(async () => {
        if (!teamId) return

        setIsLoading(true)
        setIsError(false)
        setError(null)

        try {
            const data = await teamService.getTeamInvitations(teamId)
            setInvitations(data)
        } catch (err) {
            setIsError(true)
            setError(err as Error)
            console.error('Error loading invitations:', err)
        } finally {
            setIsLoading(false)
        }
    }, [teamId])

    // Crear nueva invitación
    const createInvitation = useCallback(async (role: 'leader' | 'collaborator', options?: {
        maxUses?: number
        expiresAt?: string
    }): Promise<MutationResult<TeamInvitation>> => {
        try {
            const invitation = await teamService.createTeamInvitation(teamId, role, options)
            await loadInvitations() // Recargar lista
            return { success: true, data: invitation }
        } catch (error) {
            console.error('Error creating invitation:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            }
        }
    }, [teamId, loadInvitations])

    // Actualizar invitación
    const updateInvitation = useCallback(async (invitationId: string, updates: {
        isActive?: boolean
        maxUses?: number
        expiresAt?: string
    }): Promise<MutationResult<TeamInvitation>> => {
        try {
            const invitation = await teamService.updateTeamInvitation(invitationId, updates)
            await loadInvitations() // Recargar lista
            return { success: true, data: invitation }
        } catch (error) {
            console.error('Error updating invitation:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            }
        }
    }, [loadInvitations])

    // Eliminar invitación
    const deleteInvitation = useCallback(async (invitationId: string): Promise<MutationResult<void>> => {
        try {
            await teamService.deleteTeamInvitation(invitationId)
            await loadInvitations() // Recargar lista
            return { success: true }
        } catch (error) {
            console.error('Error deleting invitation:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            }
        }
    }, [loadInvitations])

    useEffect(() => {
        loadInvitations()
    }, [loadInvitations])

    return {
        invitations,
        isLoading,
        isError,
        error,
        loadInvitations,
        createInvitation,
        updateInvitation,
        deleteInvitation
    }
}

// ============================================================================
// MUTACIONES RTK QUERY
// ============================================================================

/**
 * Hook para crear un nuevo equipo usando RTK Query
 */
export const useCreateTeamMutation = () => {
    return useMutation({
        mutationFn: teamService.createTeam,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
        },
        onError: (error) => {
            console.error('Error creating team:', error);
        }
    });
};

/**
 * Hook para crear un equipo con invitaciones usando RTK Query
 */
export const useCreateTeamWithInvitationsMutation = () => {
    return useMutation({
        mutationFn: teamService.createTeamWithInvitations,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
        },
        onError: (error) => {
            console.error('Error creating team with invitations:', error);
        }
    });
};

/**
 * Hook para actualizar un equipo usando RTK Query
 */
export const useUpdateTeamMutation = () => {
    return useMutation({
        mutationFn: ({ teamId, formData }: {
            teamId: string;
            formData: UpdateTeamData
        }) => teamService.updateTeam(teamId, formData),
        onSuccess: (updatedTeam) => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['team', updatedTeam.id] });
        },
        onError: (error) => {
            console.error('Error updating team:', error);
        }
    });
};

