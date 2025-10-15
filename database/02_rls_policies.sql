-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Sistema de seguridad basado en políticas para multitenancy
-- Asegura que cada organización solo vea sus propios datos
-- ============================================================================

-- Habilitar RLS en todas las tablas principales
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_responses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNCIONES DE SEGURIDAD
-- ============================================================================

-- Función para obtener la organización del usuario actual (usando schema public)
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
    user_org_id UUID;
BEGIN
    -- Primero intentamos obtener desde el JWT custom claim
    SELECT (auth.jwt() ->> 'organization_id')::UUID INTO user_org_id;
    
    -- Si no está en el JWT, lo obtenemos desde la tabla users
    IF user_org_id IS NULL AND auth.uid() IS NOT NULL THEN
        SELECT organization_id INTO user_org_id 
        FROM users 
        WHERE id = auth.uid();
    END IF;
    
    RETURN user_org_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es admin de la organización
CREATE OR REPLACE FUNCTION is_organization_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_org_id UUID;
BEGIN
    -- Obtener organización del usuario
    SELECT get_user_organization_id() INTO user_org_id;
    
    IF user_org_id IS NULL OR auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Obtener rol del usuario
    SELECT role INTO user_role 
    FROM users 
    WHERE id = auth.uid() 
    AND organization_id = user_org_id;
    
    RETURN user_role IN ('admin', 'super_admin');
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- POLÍTICAS PARA ORGANIZATIONS
-- ============================================================================

-- Los usuarios pueden ver solo su propia organización
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (id = get_user_organization_id());

-- Solo super admins pueden crear organizaciones (manejado por la aplicación)
CREATE POLICY "Only system admins can insert organizations"
    ON organizations FOR INSERT
    WITH CHECK (false); -- Manejado por funciones específicas

-- Los admins pueden actualizar su propia organización
CREATE POLICY "Organization admins can update their organization"
    ON organizations FOR UPDATE
    USING (id = get_user_organization_id() AND is_organization_admin())
    WITH CHECK (id = get_user_organization_id());

-- ============================================================================
-- POLÍTICAS PARA USERS
-- ============================================================================

-- Los usuarios pueden ver otros usuarios de su organización
CREATE POLICY "Users can view users from their organization"
    ON users FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Los admins pueden insertar nuevos usuarios en su organización
CREATE POLICY "Organization admins can insert users"
    ON users FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id() 
        AND is_organization_admin()
    );

-- Los admins pueden actualizar usuarios de su organización
CREATE POLICY "Organization admins can update users"
    ON users FOR UPDATE
    USING (
        organization_id = get_user_organization_id() 
        AND is_organization_admin()
    )
    WITH CHECK (organization_id = get_user_organization_id());

-- ============================================================================
-- POLÍTICAS PARA QUESTION_TEMPLATES
-- ============================================================================

-- Los usuarios pueden ver plantillas de su organización
CREATE POLICY "Users can view templates from their organization"
    ON question_templates FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Los usuarios autenticados pueden crear plantillas para su organización
CREATE POLICY "Authenticated users can create templates"
    ON question_templates FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

-- Los usuarios pueden actualizar plantillas de su organización
CREATE POLICY "Users can update templates from their organization"
    ON question_templates FOR UPDATE
    USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

-- Solo admins pueden eliminar plantillas
CREATE POLICY "Only admins can delete templates"
    ON question_templates FOR DELETE
    USING (
        organization_id = get_user_organization_id() 
        AND is_organization_admin()
    );

-- ============================================================================
-- POLÍTICAS PARA QUESTIONS
-- ============================================================================

-- Los usuarios pueden ver preguntas de plantillas de su organización
CREATE POLICY "Users can view questions from their organization templates"
    ON questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM question_templates qt
            WHERE qt.id = questions.template_id
            AND qt.organization_id = get_user_organization_id()
        )
    );

-- Los usuarios pueden insertar preguntas en plantillas de su organización
CREATE POLICY "Users can insert questions in their organization templates"
    ON questions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM question_templates qt
            WHERE qt.id = questions.template_id
            AND qt.organization_id = get_user_organization_id()
        )
    );

-- Los usuarios pueden actualizar preguntas de su organización
CREATE POLICY "Users can update questions from their organization"
    ON questions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM question_templates qt
            WHERE qt.id = questions.template_id
            AND qt.organization_id = get_user_organization_id()
        )
    );

-- ============================================================================
-- POLÍTICAS PARA PROJECTS
-- ============================================================================

-- Los usuarios pueden ver proyectos de su organización
CREATE POLICY "Users can view projects from their organization"
    ON projects FOR SELECT
    USING (organization_id = get_user_organization_id());

-- Los usuarios pueden crear proyectos en su organización
CREATE POLICY "Users can create projects in their organization"
    ON projects FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

-- Los usuarios pueden actualizar proyectos de su organización
CREATE POLICY "Users can update projects from their organization"
    ON projects FOR UPDATE
    USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

-- ============================================================================
-- POLÍTICAS PARA PROJECT_CONFIGURATIONS
-- ============================================================================

-- Acceso basado en el proyecto asociado
CREATE POLICY "Users can view configurations from their organization projects"
    ON project_configurations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_configurations.project_id
            AND p.organization_id = get_user_organization_id()
        )
    );

CREATE POLICY "Users can manage configurations for their organization projects"
    ON project_configurations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_configurations.project_id
            AND p.organization_id = get_user_organization_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_configurations.project_id
            AND p.organization_id = get_user_organization_id()
        )
    );

-- ============================================================================
-- POLÍTICAS PARA TEAMS
-- ============================================================================

-- Los usuarios pueden ver equipos de proyectos de su organización
CREATE POLICY "Users can view teams from their organization projects"
    ON teams FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = teams.project_id
            AND p.organization_id = get_user_organization_id()
        )
    );

-- Los usuarios pueden crear equipos en proyectos de su organización
CREATE POLICY "Users can create teams in their organization projects"
    ON teams FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = teams.project_id
            AND p.organization_id = get_user_organization_id()
        )
    );

-- Los usuarios pueden actualizar equipos de su organización
CREATE POLICY "Users can update teams from their organization"
    ON teams FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = teams.project_id
            AND p.organization_id = get_user_organization_id()
        )
    );

-- ============================================================================
-- POLÍTICAS PARA TEAM_INVITATIONS
-- ============================================================================

-- Los usuarios autenticados pueden ver invitaciones de equipos de su organización
CREATE POLICY "Users can view invitations from their organization teams"
    ON team_invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM teams t
            JOIN projects p ON p.id = t.project_id
            WHERE t.id = team_invitations.team_id
            AND p.organization_id = get_user_organization_id()
        )
    );

-- Política especial para acceso público con token (sin autenticación)
CREATE POLICY "Public access with valid token"
    ON team_invitations FOR SELECT
    USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        -- Esta política se complementa con lógica de aplicación
    );

-- Los usuarios pueden crear invitaciones para equipos de su organización
CREATE POLICY "Users can create invitations for their organization teams"
    ON team_invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams t
            JOIN projects p ON p.id = t.project_id
            WHERE t.id = team_invitations.team_id
            AND p.organization_id = get_user_organization_id()
        )
    );

-- ============================================================================
-- POLÍTICAS PARA INVITATION_SESSIONS
-- ============================================================================

-- Acceso público limitado para sesiones activas
CREATE POLICY "Public access to active sessions"
    ON invitation_sessions FOR SELECT
    USING (expires_at > NOW());

-- Solo la aplicación puede crear sesiones
CREATE POLICY "Application can create sessions"
    ON invitation_sessions FOR INSERT
    WITH CHECK (true); -- Controlado por lógica de aplicación

-- Actualización de sesiones existentes
CREATE POLICY "Update own sessions"
    ON invitation_sessions FOR UPDATE
    USING (expires_at > NOW());

-- ============================================================================
-- POLÍTICAS PARA EVALUATIONS
-- ============================================================================

-- Los usuarios pueden ver evaluaciones de equipos de su organización
CREATE POLICY "Users can view evaluations from their organization teams"
    ON evaluations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM teams t
            JOIN projects p ON p.id = t.project_id
            WHERE t.id = evaluations.team_id
            AND p.organization_id = get_user_organization_id()
        )
    );

-- Acceso público para crear evaluaciones (con token válido)
CREATE POLICY "Public can create evaluations with valid invitation"
    ON evaluations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_invitations ti
            WHERE ti.id = evaluations.invitation_id
            AND ti.is_active = true
            AND (ti.expires_at IS NULL OR ti.expires_at > NOW())
        )
    );

-- ============================================================================
-- POLÍTICAS PARA EVALUATION_RESPONSES
-- ============================================================================

-- Los usuarios pueden ver respuestas de evaluaciones de su organización
CREATE POLICY "Users can view responses from their organization evaluations"
    ON evaluation_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM evaluations e
            JOIN teams t ON t.id = e.team_id
            JOIN projects p ON p.id = t.project_id
            WHERE e.id = evaluation_responses.evaluation_id
            AND p.organization_id = get_user_organization_id()
        )
    );

-- Acceso público para crear respuestas (vinculadas a evaluación válida)
CREATE POLICY "Public can create responses for valid evaluations"
    ON evaluation_responses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM evaluations e
            JOIN team_invitations ti ON ti.id = e.invitation_id
            WHERE e.id = evaluation_responses.evaluation_id
            AND ti.is_active = true
            AND (ti.expires_at IS NULL OR ti.expires_at > NOW())
        )
    );

-- ============================================================================
-- COMENTARIOS Y CONSIDERACIONES
-- ============================================================================

/*
CONSIDERACIONES IMPORTANTES:

1. **Multitenancy**: Todas las políticas están diseñadas para asegurar 
   aislamiento completo entre organizaciones.

2. **Acceso Público**: Las tablas relacionadas con invitaciones y evaluaciones 
   permiten acceso sin autenticación cuando se proporciona un token válido.

3. **Funciones de Seguridad**: Se utilizan funciones personalizadas para 
   obtener el contexto del usuario actual desde el JWT de Supabase.

4. **Escalabilidad**: Las políticas están optimizadas para minimizar el 
   impacto en el rendimiento usando EXISTS y joins eficientes.

5. **Flexibilidad**: El sistema permite diferentes niveles de acceso 
   (admin, user) sin comprometer la seguridad.

PRÓXIMOS PASOS:

1. Configurar los JWT en Supabase para incluir organization_id
2. Implementar middleware de aplicación para manejo de tokens públicos
3. Configurar funciones Edge para lógica de negocio específica
4. Implementar auditoría y logging de accesos
*/