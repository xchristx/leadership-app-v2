-- ============================================================================
-- FUNCIONES DE BASE DE DATOS ESPECIALIZADAS
-- ============================================================================
-- Funciones PostgreSQL para operaciones complejas del sistema de evaluación
-- Incluye lógica de negocio, análisis y utilidades
-- ============================================================================

-- ============================================================================
-- 1. FUNCIONES DE GESTIÓN DE PROYECTOS
-- ============================================================================

-- Función para crear un proyecto completo con configuración inicial
CREATE OR REPLACE FUNCTION create_project_with_config(
    p_organization_id UUID,
    p_template_id UUID,
    p_name VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_hierarchy_levels INTEGER DEFAULT 2,
    p_allow_re_evaluation BOOLEAN DEFAULT false,
    p_evaluation_deadline TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    project_uuid UUID;
    config_uuid UUID;
BEGIN
    -- Crear el proyecto
    INSERT INTO projects (
        organization_id, template_id, name, description, 
        hierarchy_levels, status, created_by
    ) VALUES (
        p_organization_id, p_template_id, p_name, p_description,
        p_hierarchy_levels, 'draft', auth.uid()
    ) RETURNING id INTO project_uuid;
    
    -- Crear configuración asociada
    INSERT INTO project_configurations (
        project_id, allow_re_evaluation, evaluation_deadline
    ) VALUES (
        project_uuid, p_allow_re_evaluation, p_evaluation_deadline
    ) RETURNING id INTO config_uuid;
    
    RETURN project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para activar un proyecto (validaciones incluidas)
CREATE OR REPLACE FUNCTION activate_project(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    team_count INTEGER;
    question_count INTEGER;
BEGIN
    -- Verificar que el proyecto tenga equipos
    SELECT COUNT(*) INTO team_count
    FROM teams WHERE project_id = project_uuid AND is_active = true;
    
    -- Verificar que la plantilla tenga preguntas
    SELECT COUNT(*) INTO question_count
    FROM questions q
    JOIN projects p ON p.template_id = q.template_id
    WHERE p.id = project_uuid AND q.is_active = true;
    
    IF team_count = 0 THEN
        RAISE EXCEPTION 'Cannot activate project without teams';
    END IF;
    
    IF question_count = 0 THEN
        RAISE EXCEPTION 'Cannot activate project without questions in template';
    END IF;
    
    -- Activar el proyecto
    UPDATE projects 
    SET status = 'active', start_date = CURRENT_DATE
    WHERE id = project_uuid;
    
    -- Activar todas las invitaciones de los equipos
    UPDATE team_invitations 
    SET is_active = true
    WHERE team_id IN (
        SELECT id FROM teams WHERE project_id = project_uuid
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. FUNCIONES DE GESTIÓN DE EQUIPOS E INVITACIONES
-- ============================================================================

-- Función para crear equipo con invitaciones automáticas
CREATE OR REPLACE FUNCTION create_team_with_invitations(
    p_project_id UUID,
    p_team_name VARCHAR(255),
    p_leader_name VARCHAR(255),
    p_leader_email VARCHAR(320),
    p_department VARCHAR(100) DEFAULT NULL,
    p_team_size INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    team_uuid UUID;
    project_hierarchy INTEGER;
BEGIN
    -- Obtener nivel de jerarquía del proyecto
    SELECT hierarchy_levels INTO project_hierarchy
    FROM projects WHERE id = p_project_id;
    
    -- Crear el equipo
    INSERT INTO teams (
        project_id, name, leader_name, leader_email, department, team_size
    ) VALUES (
        p_project_id, p_team_name, p_leader_name, p_leader_email, 
        p_department, p_team_size
    ) RETURNING id INTO team_uuid;
    
    -- Crear invitación para el líder
    INSERT INTO team_invitations (team_id, role_type)
    VALUES (team_uuid, 'leader');
    
    -- Crear invitación para colaboradores
    INSERT INTO team_invitations (team_id, role_type)
    VALUES (team_uuid, 'collaborator');
    
    RETURN team_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para regenerar token de invitación
CREATE OR REPLACE FUNCTION regenerate_invitation_token(invitation_uuid UUID)
RETURNS VARCHAR(64) AS $$
DECLARE
    new_token VARCHAR(64);
BEGIN
    -- Generar nuevo token
    new_token := encode(gen_random_bytes(32), 'hex');
    
    -- Actualizar token y resetear contadores
    UPDATE team_invitations 
    SET 
        unique_token = new_token,
        current_uses = 0,
        updated_at = NOW()
    WHERE id = invitation_uuid;
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. FUNCIONES DE EVALUACIÓN
-- ============================================================================

-- Función para iniciar evaluación con sesión temporal
CREATE OR REPLACE FUNCTION start_evaluation_session(
    p_invitation_token VARCHAR(64),
    p_evaluator_name VARCHAR(255),
    p_evaluator_email VARCHAR(320)
) RETURNS TABLE(
    evaluation_id UUID,
    session_id UUID,
    team_name VARCHAR(255),
    role_type VARCHAR(20)
) AS $$
DECLARE
    v_invitation_id UUID;
    v_team_id UUID;
    v_role_type VARCHAR(20);
    v_team_name VARCHAR(255);
    v_evaluation_id UUID;
    v_session_id UUID;
    v_allow_re_evaluation BOOLEAN;
    existing_evaluation_count INTEGER;
BEGIN
    -- Verificar token válido
    SELECT ti.id, ti.team_id, ti.role_type, t.name
    INTO v_invitation_id, v_team_id, v_role_type, v_team_name
    FROM team_invitations ti
    JOIN teams t ON t.id = ti.team_id
    WHERE ti.unique_token = p_invitation_token
    AND ti.is_active = true
    AND (ti.expires_at IS NULL OR ti.expires_at > NOW());
    
    IF v_invitation_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invitation token';
    END IF;
    
    -- Verificar si se permite re-evaluación
    SELECT pc.allow_re_evaluation INTO v_allow_re_evaluation
    FROM project_configurations pc
    JOIN teams t ON t.project_id = pc.project_id
    WHERE t.id = v_team_id;
    
    -- Contar evaluaciones existentes del mismo evaluador
    SELECT COUNT(*) INTO existing_evaluation_count
    FROM evaluations
    WHERE invitation_id = v_invitation_id
    AND evaluator_email = p_evaluator_email
    AND is_complete = true;
    
    IF existing_evaluation_count > 0 AND NOT v_allow_re_evaluation THEN
        RAISE EXCEPTION 'Re-evaluation not allowed for this project';
    END IF;
    
    -- Crear nueva evaluación
    INSERT INTO evaluations (
        team_id, invitation_id, evaluator_name, 
        evaluator_email, evaluator_role, is_complete
    ) VALUES (
        v_team_id, v_invitation_id, p_evaluator_name,
        p_evaluator_email, v_role_type, false
    ) RETURNING id INTO v_evaluation_id;
    
    -- Crear sesión temporal
    INSERT INTO invitation_sessions (
        invitation_id, session_data
    ) VALUES (
        v_invitation_id, 
        jsonb_build_object(
            'evaluation_id', v_evaluation_id,
            'evaluator_name', p_evaluator_name,
            'evaluator_email', p_evaluator_email
        )
    ) RETURNING id INTO v_session_id;
    
    -- Incrementar contador de usos
    UPDATE team_invitations 
    SET current_uses = current_uses + 1
    WHERE id = v_invitation_id;
    
    -- Retornar información de la sesión
    RETURN QUERY SELECT 
        v_evaluation_id, v_session_id, v_team_name, v_role_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para completar evaluación
CREATE OR REPLACE FUNCTION complete_evaluation(
    p_evaluation_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    total_questions INTEGER;
    answered_questions INTEGER;
    completion_pct DECIMAL(5,2);
BEGIN
    -- Contar preguntas totales para esta evaluación
    SELECT COUNT(*) INTO total_questions
    FROM questions q
    JOIN evaluations e ON e.team_id IN (
        SELECT t.id FROM teams t 
        JOIN projects p ON p.id = t.project_id
        WHERE p.template_id = q.template_id
    )
    WHERE e.id = p_evaluation_id
    AND q.is_active = true;
    
    -- Contar respuestas dadas
    SELECT COUNT(*) INTO answered_questions
    FROM evaluation_responses
    WHERE evaluation_id = p_evaluation_id;
    
    -- Calcular porcentaje de completitud
    IF total_questions > 0 THEN
        completion_pct := (answered_questions::DECIMAL / total_questions * 100);
    ELSE
        completion_pct := 0;
    END IF;
    
    -- Actualizar evaluación
    UPDATE evaluations 
    SET 
        is_complete = (completion_pct >= 80), -- 80% mínimo para considerarse completa
        completion_percentage = completion_pct,
        completed_at = CASE 
            WHEN completion_pct >= 80 THEN NOW() 
            ELSE completed_at 
        END
    WHERE id = p_evaluation_id;
    
    RETURN (completion_pct >= 80);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. FUNCIONES DE ANÁLISIS Y REPORTES
-- ============================================================================

-- Función para obtener resultados agregados por equipo
CREATE OR REPLACE FUNCTION get_team_results(p_team_id UUID)
RETURNS TABLE(
    category VARCHAR(100),
    question_text TEXT,
    avg_leader_score DECIMAL(5,2),
    avg_collaborator_score DECIMAL(5,2),
    response_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(q.category, 'General') as category,
        q.text_leader as question_text,
        ROUND(AVG(CASE WHEN e.evaluator_role = 'leader' THEN er.response_value END), 2) as avg_leader_score,
        ROUND(AVG(CASE WHEN e.evaluator_role = 'collaborator' THEN er.response_value END), 2) as avg_collaborator_score,
        COUNT(er.id)::INTEGER as response_count
    FROM questions q
    LEFT JOIN evaluation_responses er ON er.question_id = q.id
    LEFT JOIN evaluations e ON e.id = er.evaluation_id AND e.team_id = p_team_id
    WHERE q.template_id IN (
        SELECT p.template_id 
        FROM projects p 
        JOIN teams t ON t.project_id = p.id 
        WHERE t.id = p_team_id
    )
    AND q.is_active = true
    GROUP BY q.id, q.category, q.text_leader, q.order_index
    ORDER BY q.order_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener dashboard de proyecto
CREATE OR REPLACE FUNCTION get_project_dashboard(p_project_id UUID)
RETURNS TABLE(
    metric_name VARCHAR(50),
    metric_value DECIMAL(10,2),
    metric_label TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Total de equipos
    SELECT 
        'total_teams'::VARCHAR(50),
        COUNT(*)::DECIMAL(10,2),
        'Equipos registrados'::TEXT
    FROM teams 
    WHERE project_id = p_project_id
    
    UNION ALL
    
    -- Evaluaciones completadas
    SELECT 
        'completed_evaluations'::VARCHAR(50),
        COUNT(*)::DECIMAL(10,2),
        'Evaluaciones completadas'::TEXT
    FROM evaluations e
    JOIN teams t ON t.id = e.team_id
    WHERE t.project_id = p_project_id
    AND e.is_complete = true
    
    UNION ALL
    
    -- Tasa de respuesta general
    SELECT 
        'response_rate'::VARCHAR(50),
        ROUND(
            (COUNT(CASE WHEN e.is_complete THEN 1 END)::DECIMAL / 
             NULLIF(COUNT(ti.id), 0) * 100), 2
        ),
        'Tasa de respuesta (%)'::TEXT
    FROM teams t
    LEFT JOIN team_invitations ti ON ti.team_id = t.id AND ti.is_active = true
    LEFT JOIN evaluations e ON e.invitation_id = ti.id
    WHERE t.project_id = p_project_id
    
    UNION ALL
    
    -- Score promedio general
    SELECT 
        'average_score'::VARCHAR(50),
        ROUND(AVG(er.response_value), 2),
        'Puntuación promedio'::TEXT
    FROM evaluation_responses er
    JOIN evaluations e ON e.id = er.evaluation_id
    JOIN teams t ON t.id = e.team_id
    WHERE t.project_id = p_project_id
    AND e.is_complete = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para análisis comparativo entre equipos
CREATE OR REPLACE FUNCTION get_teams_comparison(p_project_id UUID)
RETURNS TABLE(
    team_name VARCHAR(255),
    leader_avg_score DECIMAL(5,2),
    collaborator_avg_score DECIMAL(5,2),
    total_responses INTEGER,
    last_evaluation TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.name,
        ROUND(AVG(CASE WHEN e.evaluator_role = 'leader' THEN er.response_value END), 2) as leader_avg,
        ROUND(AVG(CASE WHEN e.evaluator_role = 'collaborator' THEN er.response_value END), 2) as collab_avg,
        COUNT(er.id)::INTEGER as total_resp,
        MAX(e.completed_at) as last_eval
    FROM teams t
    LEFT JOIN evaluations e ON e.team_id = t.id AND e.is_complete = true
    LEFT JOIN evaluation_responses er ON er.evaluation_id = e.id
    WHERE t.project_id = p_project_id
    GROUP BY t.id, t.name
    ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. FUNCIONES DE MANTENIMIENTO Y UTILIDADES
-- ============================================================================

-- Función para limpiar datos expirados (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS TABLE(
    cleanup_type TEXT,
    items_cleaned INTEGER
) AS $$
DECLARE
    sessions_cleaned INTEGER;
    invitations_cleaned INTEGER;
BEGIN
    -- Limpiar sesiones expiradas
    DELETE FROM invitation_sessions 
    WHERE expires_at < NOW();
    GET DIAGNOSTICS sessions_cleaned = ROW_COUNT;
    
    -- Desactivar invitaciones expiradas
    UPDATE team_invitations 
    SET is_active = false
    WHERE expires_at < NOW() AND is_active = true;
    GET DIAGNOSTICS invitations_cleaned = ROW_COUNT;
    
    -- Retornar estadísticas de limpieza
    RETURN QUERY
    SELECT 'expired_sessions'::TEXT, sessions_cleaned
    UNION ALL
    SELECT 'expired_invitations'::TEXT, invitations_cleaned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para backup de datos de evaluación
CREATE OR REPLACE FUNCTION export_evaluation_data(p_project_id UUID)
RETURNS TABLE(
    team_name VARCHAR(255),
    evaluator_name VARCHAR(255),
    evaluator_role VARCHAR(20),
    question_category VARCHAR(100),
    question_text TEXT,
    response_value INTEGER,
    response_text TEXT,
    completed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.name as team_name,
        e.evaluator_name,
        e.evaluator_role,
        COALESCE(q.category, 'General') as question_category,
        CASE 
            WHEN e.evaluator_role = 'leader' THEN q.text_leader
            ELSE q.text_collaborator
        END as question_text,
        er.response_value,
        er.response_text,
        e.completed_at
    FROM teams t
    JOIN evaluations e ON e.team_id = t.id
    JOIN evaluation_responses er ON er.evaluation_id = e.id
    JOIN questions q ON q.id = er.question_id
    WHERE t.project_id = p_project_id
    AND e.is_complete = true
    ORDER BY t.name, e.completed_at, q.order_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS ADICIONALES
-- ============================================================================

-- Trigger para actualizar completion_percentage automáticamente
CREATE OR REPLACE FUNCTION update_evaluation_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar porcentaje de completitud cuando se inserta/actualiza una respuesta
    PERFORM complete_evaluation(NEW.evaluation_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_evaluation_completion
    AFTER INSERT OR UPDATE ON evaluation_responses
    FOR EACH ROW EXECUTE FUNCTION update_evaluation_completion();

-- Trigger para actualizar last_activity en sessions
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invitation_sessions 
    SET last_activity = NOW()
    WHERE invitation_id = (
        SELECT invitation_id FROM evaluations WHERE id = NEW.evaluation_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_activity
    AFTER INSERT OR UPDATE ON evaluation_responses
    FOR EACH ROW EXECUTE FUNCTION update_session_activity();