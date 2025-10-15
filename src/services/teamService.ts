// ============================================================================
// SERVICIO DE EQUIPOS COMPLETO
// ============================================================================
// Servicio para gestionar equipos con sistema completo de invitaciones
// ============================================================================

import { supabase } from '../lib/supabase';
import type { Team, CreateTeamData, UpdateTeamData, TeamInvitation } from '../types';

// ============================================================================
// TIPOS ESPECÍFICOS DEL SERVICIO
// ============================================================================

export interface TeamStats {
  total_invitations: number;
  active_invitations: number;
  completed_evaluations: number;
  pending_evaluations: number;
  completion_rate: number;
  total_members: number;
}

// Formulario para crear equipo con líder
export interface CreateTeamFormData extends CreateTeamData {
  leader_name: string;
  leader_email: string;
}

export interface TeamDashboard {
  team: Team;
  stats: TeamStats;
  invitations: TeamInvitation[];
  invitation_links: {
    leader?: string;
    collaborator?: string;
  };
  recent_evaluations: Array<{
    id: string;
    evaluator_name: string;
    evaluator_role: string;
    completion_percentage: number | null;
    created_at: string;
  }>;
}

// ============================================================================
// OPERACIONES CRUD DE EQUIPOS
// ============================================================================

/**
 * Obtener todos los equipos de una organización
 */
export const getTeams = async (organizationId?: string, includeInactive: boolean = false): Promise<Team[]> => {
  try {
    let query = supabase
      .from('teams')
      .select(`
        id,
        name,
        team_size,
        is_active,
        project_id,
        created_at,
        updated_at,
        projects!inner(
          id,
          name,
          organization_id,
          status
        )
      `);

    // Filtrar por organización si se proporciona
    if (organizationId) {
      query = query.eq('projects.organization_id', organizationId);
    }

    // Por defecto, solo mostrar equipos activos
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener equipos: ${error.message}`);
    }

    console.log(`Equipos obtenidos: ${data.length} ${includeInactive ? '(incluyendo inactivos)' : '(solo activos)'}`);

    return data as Team[];
  } catch (error) {
    console.error('Error in getTeams:', error);
    throw error;
  }
};

/**
 * Obtener un equipo por ID con información del proyecto
 */
export const getTeam = async (id: string): Promise<Team | null> => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        team_size,
        is_active,
        project_id,
        created_at,
        updated_at,
        projects(
          id,
          name,
          description,
          status,
          organization_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error al obtener equipo: ${error.message}`);
    }

    return data as Team;
  } catch (error) {
    console.error('Error in getTeam:', error);
    throw error;
  }
};

/**
 * Crear un nuevo equipo
 */
export const createTeam = async (teamData: CreateTeamData): Promise<Team> => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .insert([{
        name: teamData.name,
        leader_name: teamData.leader_name,
        leader_email: teamData.leader_email,
        team_size: teamData.team_size,
        project_id: teamData.project_id,
        is_active: true
      }])
      .select(`
        id,
        name,
        leader_name,
        leader_email,
        team_size,
        is_active,
        project_id,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw new Error(`Error al crear equipo: ${error.message}`);
    }

    return data as Team;
  } catch (error) {
    console.error('Error in createTeam:', error);
    throw error;
  }
};

/**
 * Actualizar un equipo existente
 */
export const updateTeam = async (id: string, updates: UpdateTeamData): Promise<Team> => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .update({
        name: updates.name,
        team_size: updates.team_size,
        leader_name: updates.leader_name,
        leader_email: updates.leader_email,
        updated_at: new Date().toISOString(),
        is_active: updates.is_active
      })
      .eq('id', id)
      .select(`
        id,
        name,
        team_size,
        is_active,
        project_id,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw new Error(`Error al actualizar equipo: ${error.message}`);
    }

    return data as Team;
  } catch (error) {
    console.error('Error in updateTeam:', error);
    throw error;
  }
};

/**
 * Eliminar un equipo (soft delete)
 */
export const deleteTeam = async (id: string): Promise<void> => {
  try {
    // Primero verificamos que el equipo existe
    const { data: existingTeam, error: fetchError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new Error('El equipo no existe');
      }
      throw new Error(`Error al verificar equipo: ${fetchError.message}`);
    }

    console.log(`Intentando eliminar equipo: ${existingTeam.name} (${id})`);

    // Soft delete: cambiar is_active a false en lugar de eliminar el registro
    const { data, error } = await supabase
      .from('teams')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, name, is_active');

    if (error) {
      console.error('Error en soft delete:', error);
      throw new Error(`Error al eliminar equipo: ${error.message}`);
    }

    console.log('Equipo eliminado (soft delete):', data);

  } catch (error) {
    console.error('Error in deleteTeam:', error);
    throw error;
  }
};

// ============================================================================
// GESTIÓN DE INVITACIONES DE EQUIPOS
// ============================================================================

/**
 * Crear invitaciones para un equipo (líder y colaborador)
 */
export const createTeamInvitations = async (teamId: string): Promise<TeamInvitation[]> => {
  try {
    const invitations = [
      {
        team_id: teamId,
        role_type: 'leader' as const,
        unique_token: crypto.randomUUID(),
        is_active: true,
        max_uses: 1, // Líder: solo una persona
        current_uses: 0,
        expires_at: null // Sin expiración por defecto
      },
      {
        team_id: teamId,
        role_type: 'collaborator' as const,
        unique_token: crypto.randomUUID(),
        is_active: true,
        max_uses: null, // Colaboradores: sin límite por defecto
        current_uses: 0,
        expires_at: null
      }
    ];

    const { data, error } = await supabase
      .from('team_invitations')
      .insert(invitations)
      .select('*');

    if (error) {
      throw new Error(`Error al crear invitaciones: ${error.message}`);
    }

    return data as TeamInvitation[];
  } catch (error) {
    console.error('Error in createTeamInvitations:', error);
    throw error;
  }
};

/**
 * Obtener invitaciones de un equipo
 */
export const getTeamInvitations = async (teamId: string): Promise<TeamInvitation[]> => {
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener invitaciones: ${error.message}`);
    }

    return data as TeamInvitation[];
  } catch (error) {
    console.error('Error in getTeamInvitations:', error);
    throw error;
  }
};

/**
 * Crear una invitación individual
 */
export const createTeamInvitation = async (
  teamId: string,
  role: 'leader' | 'collaborator',
  options?: { maxUses?: number; expiresAt?: string }
): Promise<TeamInvitation> => {
  try {
    const invitationData = {
      team_id: teamId,
      role_type: role,
      unique_token: crypto.randomUUID(),
      is_active: true,
      max_uses: options?.maxUses || null,
      current_uses: 0,
      expires_at: options?.expiresAt || null
    };

    const { data, error } = await supabase
      .from('team_invitations')
      .insert([invitationData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear invitación: ${error.message}`);
    }

    return data as TeamInvitation;
  } catch (error) {
    console.error('Error in createTeamInvitation:', error);
    throw error;
  }
};

/**
 * Actualizar una invitación
 */
export const updateTeamInvitation = async (
  invitationId: string,
  updates: { isActive?: boolean; maxUses?: number; expiresAt?: string }
): Promise<TeamInvitation> => {
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .update({
        is_active: updates.isActive,
        max_uses: updates.maxUses,
        expires_at: updates.expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar invitación: ${error.message}`);
    }

    return data as TeamInvitation;
  } catch (error) {
    console.error('Error in updateTeamInvitation:', error);
    throw error;
  }
};

/**
 * Eliminar una invitación
 */
export const deleteTeamInvitation = async (invitationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      throw new Error(`Error al eliminar invitación: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteTeamInvitation:', error);
    throw error;
  }
};

/**
 * Obtener invitación por token
 */
export const getInvitationByToken = async (token: string): Promise<TeamInvitation | null> => {
  try {
    const { data, error } = await supabase
      .from('team_invitations')
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
            organization_id,
            configuration:project_configurations(*)
          )
        )
      `)
      .eq('unique_token', token)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error al obtener invitación: ${error.message}`);
    }

    return data as TeamInvitation;
  } catch (error) {
    console.error('Error in getInvitationByToken:', error);
    throw error;
  }
};

/**
 * Actualizar uso de invitación
 */
export const useInvitation = async (token: string): Promise<TeamInvitation> => {
  try {
    // Primero obtenemos el uso actual
    const { data: current, error: fetchError } = await supabase
      .from('team_invitations')
      .select('current_uses')
      .eq('unique_token', token)
      .single();

    if (fetchError) {
      throw new Error(`Error al obtener invitación: ${fetchError.message}`);
    }

    // Actualizamos con el nuevo valor
    const { data, error } = await supabase
      .from('team_invitations')
      .update({
        current_uses: (current.current_uses || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('unique_token', token)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Error al usar invitación: ${error.message}`);
    }

    return data as TeamInvitation;
  } catch (error) {
    console.error('Error in useInvitation:', error);
    throw error;
  }
};

/**
 * Generar enlaces de invitación con tokens únicos
 */
export const generateInvitationLinks = (teamInvitations: TeamInvitation[]): { leader?: string; collaborator?: string } => {
  const baseUrl = window.location.origin;
  const links: { leader?: string; collaborator?: string } = {};

  teamInvitations.forEach(invitation => {
    if (invitation.is_active) {
      const url = `${baseUrl}/evaluation/${invitation.unique_token}`;
      if (invitation.role_type === 'leader') {
        links.leader = url;
      } else if (invitation.role_type === 'collaborator') {
        links.collaborator = url;
      }
    }
  });

  return links;
};

// ============================================================================
// ESTADÍSTICAS Y DASHBOARD
// ============================================================================

/**
 * Obtener estadísticas de un equipo
 */
export const getTeamStats = async (teamId: string): Promise<TeamStats> => {
  try {
    // Obtener invitaciones del equipo
    const invitations = await getTeamInvitations(teamId);
    const totalInvitations = invitations.length;
    const activeInvitations = invitations.filter(inv => inv.is_active).length;

    // Obtener evaluaciones del equipo
    const { data: evaluations, error: evalError } = await supabase
      .from('evaluations')
      .select('id, is_complete, completion_percentage, evaluator_role')
      .eq('team_id', teamId);

    if (evalError) {
      throw new Error(`Error al obtener evaluaciones: ${evalError.message}`);
    }

    const totalEvaluations = evaluations.length;
    const completedEvaluations = evaluations.filter(evaluation => evaluation.is_complete).length;
    const completionRate = totalEvaluations > 0 ? (completedEvaluations / totalEvaluations) * 100 : 0;

    // Contar miembros únicos (líder + colaboradores)
    const uniqueMembers = new Set(evaluations.map(e => e.evaluator_role)).size;

    return {
      total_invitations: totalInvitations,
      active_invitations: activeInvitations,
      completed_evaluations: completedEvaluations,
      pending_evaluations: totalEvaluations - completedEvaluations,
      completion_rate: completionRate,
      total_members: uniqueMembers
    };
  } catch (error) {
    console.error('Error in getTeamStats:', error);
    throw error;
  }
};

/**
 * Obtener dashboard completo de un equipo
 */
export const getTeamDashboard = async (teamId: string): Promise<TeamDashboard> => {
  try {
    // Obtener equipo
    const team = await getTeam(teamId);
    if (!team) {
      throw new Error('Equipo no encontrado');
    }

    const stats = await getTeamStats(teamId);
    const invitations = await getTeamInvitations(teamId);
    const invitationLinks = generateInvitationLinks(invitations);

    // Obtener evaluaciones recientes
    const { data: recentEvaluations, error: evalError } = await supabase
      .from('evaluations')
      .select('id, evaluator_name, evaluator_role, completion_percentage, created_at')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (evalError) {
      throw new Error(`Error al obtener evaluaciones recientes: ${evalError.message}`);
    }

    return {
      team,
      stats,
      invitations,
      invitation_links: invitationLinks,
      recent_evaluations: recentEvaluations || []
    };
  } catch (error) {
    console.error('Error in getTeamDashboard:', error);
    throw error;
  }
};

/**
 * Crear equipo con invitaciones automáticas
 */
export const createTeamWithInvitations = async (teamData: CreateTeamFormData): Promise<Team> => {
  try {
    // 1. Crear el equipo básico
    const newTeam = await createTeam({
      name: teamData.name,
      project_id: teamData.project_id,
      team_size: teamData.team_size
    });

    // 2. Crear invitaciones automáticamente
    const invitations = await createTeamInvitations(newTeam.id);

    // 3. Agregar información del líder al equipo
    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams')
      .update({
        leader_name: teamData.leader_name,
        leader_email: teamData.leader_email,
        updated_at: new Date().toISOString()
      })
      .eq('id', newTeam.id)
      .select(`
        id,
        name,
        leader_name,
        leader_email,
        team_size,
        is_active,
        project_id,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.warn('Error al actualizar información del líder:', updateError);
      // No es crítico, devolvemos el equipo sin la info del líder
    }

    console.log('Equipo creado exitosamente con invitaciones:', {
      team: updatedTeam || newTeam,
      invitations: invitations.length
    });

    return (updatedTeam || newTeam) as Team;
  } catch (error) {
    console.error('Error in createTeamWithInvitations:', error);
    throw error;
  }
};