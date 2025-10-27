// ============================================================================
// SERVICIO DE EQUIPOS COMPLETO
// ============================================================================
// Servicio para gestionar equipos con sistema completo de invitaciones
// ============================================================================

import { supabase } from '../lib/supabase';
import type { Team, UpdateTeamData, TeamInvitation, TeamFormData } from '../types';

// Re-exportar tipos para facilitar el uso
export type { CreateTeamData, UpdateTeamData } from '../types';

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

// Ya no necesitamos CreateTeamFormData separado, usamos CreateTeamData directamente
// Los datos del líder se completarán automáticamente cuando haga su evaluación

export interface TeamDashboard {
  team: Team;
  stats: TeamStats;
  invitations: TeamInvitation[];
  invitation_links: {
    leader?: string;
    collaborator?: string;
    supervisor?: string;
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
        leader_name,
        leader_email,
        team_type,
        department,
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


    return data as Team[];
  } catch (error) {
    console.error('Error in getTeams:', error);
    throw error;
  }
};

/**
 * Obtener equipos con estadísticas incluidas
 */
export const getTeamsWithStats = async (organizationId?: string, includeInactive: boolean = false): Promise<Team[]> => {
  try {
    const teams = await getTeams(organizationId, includeInactive);

    // Obtener estadísticas para cada equipo
    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        try {
          const stats = await getTeamStats(team.id);
          return {
            ...team,
            _stats: {
              ...stats,
              total_evaluations: stats.completed_evaluations + stats.pending_evaluations
            }
          };
        } catch (error) {
          console.warn(`Error al obtener estadísticas para equipo ${team.id}:`, error);
          return {
            ...team,
            _stats: {
              total_evaluations: 0,
              completed_evaluations: 0,
              pending_evaluations: 0,
              completion_rate: 0,
              total_members: 0
            }
          };
        }
      })
    );

    return teamsWithStats;
  } catch (error) {
    console.error('Error in getTeamsWithStats:', error);
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
        leader_name,
        leader_email,
        team_type,
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
export const createTeam = async (teamData: TeamFormData): Promise<Team> => {
  try {
    // Solo incluir leader_name y leader_email si están definidos y no son cadenas vacías
    const insertData: Partial<Team> & { project_id: string; name: string; is_active: boolean } = {
      name: teamData.name,
      team_size: teamData.team_size ?? undefined,
      project_id: teamData.project_id,
      is_active: true,
      department: teamData.department ?? undefined
    };

    // Solo agregar campos del líder si tienen valores válidos
    if (teamData.leader_name && teamData.leader_name.trim()) {
      insertData.leader_name = teamData.leader_name.trim();
    }
    if (teamData.leader_email && teamData.leader_email.trim()) {
      insertData.leader_email = teamData.leader_email.trim();
    }

    const { data, error } = await supabase
      .from('teams')
      .insert([insertData])
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
        leader_email: updates.leader_email || null,
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
      .order('role_type', { ascending: false });

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
  role: 'leader' | 'collaborator' | 'supervisor',
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
export const generateInvitationLinks = (teamInvitations: TeamInvitation[]): { leader?: string; collaborator?: string; supervisor?: string } => {
  const baseUrl = window.location.origin;
  const links: { leader?: string; collaborator?: string; supervisor?: string } = {};

  teamInvitations.forEach(invitation => {
    if (invitation.is_active) {
      const url = `${baseUrl}/evaluation/${invitation.unique_token}`;
      if (invitation.role_type === 'leader') {
        links.leader = url;
      } else if (invitation.role_type === 'collaborator') {
        links.collaborator = url;
      } else if (invitation.role_type === 'supervisor') {
        links.supervisor = url;
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
    const uniqueMembers = evaluations.length;

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
 * Verificar si un email ya realizó una evaluación en un equipo
 */
export const checkEmailEvaluationExists = async (
  teamId: string,
  email: string
): Promise<{ exists: boolean; evaluation?: object; canEdit?: boolean }> => {
  try {
    // Buscar evaluación existente por email y equipo
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
        team_id,
        teams!inner(
          project_id,
          projects!inner(
            project_configurations(allow_re_evaluation)
          )
        )
      `)
      .eq('team_id', teamId)
      .eq('evaluator_email', email.toLowerCase().trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró evaluación - puede proceder
        return { exists: false };
      }
      throw new Error(`Error al verificar email: ${error.message}`);
    }

    // Verificar si se permite re-evaluación
    const projectConfig = evaluation?.teams?.projects?.project_configurations;
    const canEdit = projectConfig?.allow_re_evaluation || false;

    return {
      exists: true,
      evaluation,
      canEdit
    };
  } catch (error) {
    console.error('Error in checkEmailEvaluationExists:', error);
    throw error;
  }
};

/**
 * Obtener evaluación existente por email y equipo (para edición)
 */
export const getExistingEvaluation = async (
  teamId: string,
  email: string
): Promise<{
  evaluation: object | null;
  responses: object[];
  questions: object[];
}> => {
  try {
    // 1. Obtener evaluación
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select(`
        *,
        teams!inner(
          project_id,
          projects!inner(
            template_id,
            project_configurations(*)
          )
        )
      `)
      .eq('team_id', teamId)
      .eq('evaluator_email', email.toLowerCase().trim())
      .single();

    if (evalError || !evaluation) {
      return { evaluation: null, responses: [], questions: [] };
    }

    // 2. Obtener respuestas existentes
    const { data: responses, error: responsesError } = await supabase
      .from('evaluation_responses')
      .select('*')
      .eq('evaluation_id', evaluation.id);

    if (responsesError) {
      console.warn('Error al obtener respuestas:', responsesError);
    }

    // 3. Obtener preguntas del template
    const templateId = evaluation.teams?.projects?.template_id;
    if (!templateId) {
      return { evaluation, responses: responses || [], questions: [] };
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

    return {
      evaluation,
      responses: responses || [],
      questions: questions || []
    };
  } catch (error) {
    console.error('Error in getExistingEvaluation:', error);
    throw error;
  }
};

/**
 * Actualizar evaluación existente
 */
export const updateExistingEvaluation = async (
  evaluationId: string,
  responses: Record<string, string | number>,
  evaluatorInfo?: { name: string; email: string; additionalInfo?: string }
): Promise<void> => {
  try {
    // 1. Actualizar información del evaluador si se proporciona
    if (evaluatorInfo) {
      const { error: updateError } = await supabase
        .from('evaluations')
        .update({
          evaluator_name: evaluatorInfo.name,
          evaluator_email: evaluatorInfo.email,
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

    // 2. Eliminar respuestas existentes
    const { error: deleteError } = await supabase
      .from('evaluation_responses')
      .delete()
      .eq('evaluation_id', evaluationId);

    if (deleteError) {
      throw new Error(`Error al eliminar respuestas previas: ${deleteError.message}`);
    }

    // 3. Insertar nuevas respuestas
    const responseData = Object.entries(responses).map(([questionId, value]) => ({
      evaluation_id: evaluationId,
      question_id: questionId,
      response_value: typeof value === 'number' ? value : null,
      response_text: typeof value === 'string' ? value : null,
      response_data: typeof value === 'object' ? value : null,
    }));

    const { error: insertError } = await supabase
      .from('evaluation_responses')
      .insert(responseData);

    if (insertError) {
      throw new Error(`Error al guardar nuevas respuestas: ${insertError.message}`);
    }

    console.log('Evaluación actualizada exitosamente:', evaluationId);
  } catch (error) {
    console.error('Error in updateExistingEvaluation:', error);
    throw error;
  }
};

/**
 * Crear equipo con invitaciones automáticas
 */
export const createTeamWithInvitations = async (teamData: TeamFormData): Promise<Team> => {
  try {
    // 1. Crear el equipo básico (sin datos del líder)
    const newTeam = await createTeam(teamData);

    // 2. Crear invitaciones automáticamente
    const invitations = await createTeamInvitations(newTeam.id);

    // 3. Retornar el equipo con sus invitaciones (sin datos del líder por ahora)
    console.log('Equipo creado exitosamente con invitaciones:', {
      team: newTeam,
      invitations: invitations.length
    });

    return {
      ...newTeam,
      invitations
    };
  } catch (error) {
    console.error('Error in createTeamWithInvitations:', error);
    throw error;
  }
};

/**
 * Actualizar información del líder automáticamente cuando complete su primera evaluación
 */
export const updateTeamLeaderInfo = async (
  teamId: string,
  leaderName: string,
  leaderEmail: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Actualizar solo si los campos están vacíos (primera vez que el líder completa evaluación)
    const { error } = await supabase
      .from('teams')
      .update({
        leader_name: leaderName,
        leader_email: leaderEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId)
      .is('leader_name', null) // Solo actualizar si leader_name es NULL
      .select('id, leader_name, leader_email')
      .single();

    if (error) {
      // Si el error es porque no se encontró (ya tenía datos), no es un error crítico
      if (error.code === 'PGRST116') {
        console.log('Información del líder ya estaba completa:', { teamId });
        return { success: true };
      }
      console.error('Error al actualizar información del líder:', error);
      return { success: false, error: error.message };
    }

    console.log('Información del líder actualizada exitosamente:', { teamId, leaderName, leaderEmail });
    return { success: true };
  } catch (error) {
    console.error('Error in updateTeamLeaderInfo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};