// ============================================================================
// SERVICIO DE LIDERAZGO DE PROYECTO
// ============================================================================
// Maneja la creación y gestión de equipos especiales para evaluar liderazgo de proyecto
// ============================================================================

import { supabase } from '../lib/supabase';
import type { Team, TeamInvitation } from '../types';

export interface CreateProjectLeadershipTeamData {
    project_id: string;
    project_name: string;
}

export interface ProjectLeadershipTeamResult {
    success: boolean;
    team?: Team;
    invitations?: TeamInvitation[];
    error?: string;
}

/**
 * Crea un equipo especial para la evaluación de liderazgo del proyecto
 * Genera solo 2 invitaciones:
 * - 1 para el líder del proyecto (autoevaluación)
 * - 1 para todos los líderes de equipo (evaluación colaborativa)
 */
export const createProjectLeadershipTeam = async (
    data: CreateProjectLeadershipTeamData
): Promise<ProjectLeadershipTeamResult> => {
    try {
        const { project_id, project_name } = data;

        console.log('🎯 Creando equipo de liderazgo del proyecto:', { project_id, project_name });

        // 1. Verificar si ya existe un equipo de liderazgo para este proyecto
        const { data: existingTeam } = await supabase
            .from('teams')
            .select('id')
            .eq('project_id', project_id)
            .eq('team_type', 'project_leadership')
            .single();

        if (existingTeam) {
            return {
                success: false,
                error: 'Ya existe una evaluación de liderazgo para este proyecto',
            };
        }

        // 2. Crear el equipo de liderazgo del proyecto
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert({
                name: `Evaluación de Liderazgo - ${project_name}`,
                project_id: project_id,
                team_type: 'project_leadership',
                team_size: 2, // 1 líder + 1 enlace para todos los colaboradores
                is_active: true,
            })
            .select()
            .single();

        if (teamError) {
            console.error('❌ Error al crear equipo de liderazgo:', teamError);
            throw teamError;
        }

        console.log('✅ Equipo de liderazgo creado:', team);

        // 3. Generar tokens únicos para las invitaciones
        const leaderToken = crypto.randomUUID();
        const collaboratorsToken = crypto.randomUUID();

        // 4. Crear invitación para el líder del proyecto (autoevaluación)
        const leaderInvitation = {
            team_id: team.id,
            role_type: 'leader',
            unique_token: leaderToken,
            is_active: true,
            max_uses: 1, // Líder: solo una persona
            current_uses: 0,
            expires_at: null // Sin expiración por defecto
        };

        // 5. Crear UNA SOLA invitación para TODOS los líderes de equipo
        const collaboratorsInvitation = {
            team_id: team.id,
            role_type: 'collaborator',
            unique_token: collaboratorsToken,
            is_active: true,
            max_uses: null, // Colaboradores: sin límite por defecto
            current_uses: 0,
            expires_at: null
        };

        // 6. Insertar ambas invitaciones
        const invitationsToInsert = [leaderInvitation, collaboratorsInvitation];

        const { data: invitations, error: invitationsError } = await supabase
            .from('team_invitations')
            .insert(invitationsToInsert)
            .select();

        if (invitationsError) {
            console.error('❌ Error al crear invitaciones:', invitationsError);
            // Si falla la creación de invitaciones, eliminar el equipo creado
            await supabase.from('teams').delete().eq('id', team.id);
            throw invitationsError;
        }

        console.log('✅ Invitaciones creadas:', invitations);

        return {
            success: true,
            team: team as Team,
            invitations: invitations as TeamInvitation[],
        };
    } catch (error) {
        console.error('❌ Error en createProjectLeadershipTeam:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
        };
    }
};

/**
 * Verifica si existe un equipo de liderazgo para un proyecto
 */
export const checkProjectLeadershipTeam = async (
    projectId: string
): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('teams')
            .select('id')
            .eq('project_id', projectId)
            .eq('team_type', 'project_leadership')
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows returned
            console.error('Error checking project leadership team:', error);
        }

        return !!data;
    } catch (error) {
        console.error('Error in checkProjectLeadershipTeam:', error);
        return false;
    }
};

/**
 * Obtiene el equipo de liderazgo de un proyecto
 */
export const getProjectLeadershipTeam = async (projectId: string) => {
    try {
        const { data, error } = await supabase
            .from('teams')
            .select('*, team_invitations(*)')
            .eq('project_id', projectId)
            .eq('team_type', 'project_leadership')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error getting project leadership team:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error in getProjectLeadershipTeam:', error);
        return null;
    }
};

/**
 * Obtiene las invitaciones del equipo de liderazgo
 */
export const getProjectLeadershipInvitations = async (teamId: string) => {
    try {
        const { data, error } = await supabase
            .from('team_invitations')
            .select('*')
            .eq('team_id', teamId)
            .order('role_type', { ascending: false }); // leader primero

        if (error) {
            console.error('Error getting leadership invitations:', error);
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error in getProjectLeadershipInvitations:', error);
        return [];
    }
};
