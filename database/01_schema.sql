-- ============================================================================
-- SUPABASE LEADERSHIP EVALUATION SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- Sistema de evaluación de equipos de trabajo con 2-3 niveles jerárquicos
-- Flujo: Organizaciones → Plantillas → Proyectos → Equipos → Evaluaciones
-- ============================================================================

-- Configuración inicial
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. ORGANIZATIONS (Multitenancy)
-- ============================================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    
    -- Timestamps automáticos
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z0-9-]+$')
);

-- ============================================================================
-- 2. USERS (Administradores del sistema)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(320) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    
    -- Metadata
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_login_at TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(organization_id, email),
    CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================================
-- 3. QUESTION_TEMPLATES (Plantillas reutilizables)
-- ============================================================================
CREATE TABLE question_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    version_type VARCHAR(20) DEFAULT 'both' CHECK (version_type IN ('leader', 'collaborator', 'both')),
    
    -- Estado y metadata
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 4. QUESTIONS (Preguntas adaptables por rol)
-- ============================================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES question_templates(id) ON DELETE CASCADE,
    
    -- Texto adaptable por rol
    text_leader TEXT NOT NULL,
    text_collaborator TEXT NOT NULL,
    
    -- Organización y metadata
    category VARCHAR(100),
    order_index INTEGER NOT NULL DEFAULT 0,
    question_type VARCHAR(20) DEFAULT 'likert' CHECK (question_type IN ('likert', 'text', 'multiple_choice')),
    
    -- Configuración de respuesta
    response_config JSONB DEFAULT '{"scale": 5, "labels": ["Muy en desacuerdo", "En desacuerdo", "Neutral", "De acuerdo", "Muy de acuerdo"]}',
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(template_id, order_index)
);

-- ============================================================================
-- 5. PROJECTS (Contenedor de evaluaciones)
-- ============================================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES question_templates(id) ON DELETE RESTRICT,
    
    -- Información básica
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuración de jerarquía
    hierarchy_levels INTEGER DEFAULT 2 CHECK (hierarchy_levels IN (2, 3)),
    
    -- Estado del proyecto
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    
    -- Fechas importantes
    start_date DATE,
    end_date DATE,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

-- ============================================================================
-- 6. PROJECT_CONFIGURATIONS (Configuraciones específicas)
-- ============================================================================
CREATE TABLE project_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Configuraciones de evaluación
    allow_re_evaluation BOOLEAN DEFAULT false,
    require_evaluator_info BOOLEAN DEFAULT true,
    
    -- Fechas límite
    evaluation_deadline TIMESTAMPTZ,
    reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1], -- Días para recordatorios
    
    -- Configuraciones personalizadas
    custom_settings JSONB DEFAULT '{}',
    
    -- Notificaciones
    email_notifications BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 7. TEAMS (Equipos de trabajo por proyecto)
-- ============================================================================
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Información del equipo
    name VARCHAR(255) NOT NULL,
    
    -- Información del líder
    leader_name VARCHAR(255) NOT NULL,
    leader_email VARCHAR(320) NOT NULL,
    
    -- Información adicional
    department VARCHAR(100),
    team_size INTEGER,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT team_name_unique_per_project UNIQUE(project_id, name),
    CONSTRAINT leader_email_format CHECK (leader_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================================
-- 8. TEAM_INVITATIONS (Links únicos por equipo y rol)
-- ============================================================================
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Tipo de rol para esta invitación
    role_type VARCHAR(20) NOT NULL CHECK (role_type IN ('leader', 'collaborator')),
    
    -- Token único para acceso sin auth
    unique_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    -- Control de acceso
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER, -- NULL = ilimitado
    current_uses INTEGER DEFAULT 0,
    
    -- Fechas de validez
    expires_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(team_id, role_type),
    CONSTRAINT valid_uses CHECK (max_uses IS NULL OR current_uses <= max_uses)
);

-- ============================================================================
-- 9. INVITATION_SESSIONS (Sesiones temporales para no autenticados)
-- ============================================================================
CREATE TABLE invitation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID UNIQUE NOT NULL REFERENCES team_invitations(id) ON DELETE CASCADE,
    
    -- Datos de sesión temporal
    session_data JSONB DEFAULT '{}',
    
    -- Control de actividad
    last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 10. EVALUATIONS (Evaluaciones completadas)
-- ============================================================================
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invitation_id UUID NOT NULL REFERENCES team_invitations(id) ON DELETE CASCADE,
    
    -- Información del evaluador
    evaluator_name VARCHAR(255) NOT NULL,
    evaluator_email VARCHAR(320) NOT NULL,
    evaluator_role VARCHAR(20) NOT NULL CHECK (evaluator_role IN ('leader', 'collaborator')),
    
    -- Estado y metadatos
    completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_complete BOOLEAN DEFAULT false,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Datos adicionales del evaluador
    evaluator_metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT evaluator_email_format CHECK (evaluator_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT completion_percentage_valid CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- ============================================================================
-- 11. EVALUATION_RESPONSES (Respuestas individuales)
-- ============================================================================
CREATE TABLE evaluation_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    
    -- Respuesta (flexible para diferentes tipos)
    response_value INTEGER, -- Para escalas numéricas
    response_text TEXT,     -- Para respuestas abiertas
    response_data JSONB,    -- Para respuestas complejas
    
    -- Metadatos de la respuesta
    response_time_seconds INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(evaluation_id, question_id),
    CONSTRAINT response_value_valid CHECK (response_value IS NULL OR response_value BETWEEN 1 AND 10)
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Organizaciones
CREATE INDEX idx_organizations_subdomain ON organizations(subdomain);

-- Usuarios
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users USING gin(email gin_trgm_ops);

-- Plantillas
CREATE INDEX idx_question_templates_organization_id ON question_templates(organization_id);
CREATE INDEX idx_question_templates_active ON question_templates(is_active) WHERE is_active = true;

-- Preguntas
CREATE INDEX idx_questions_template_id ON questions(template_id);
CREATE INDEX idx_questions_order ON questions(template_id, order_index);
CREATE INDEX idx_questions_category ON questions(category) WHERE category IS NOT NULL;

-- Proyectos
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_template_id ON projects(template_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Equipos
CREATE INDEX idx_teams_project_id ON teams(project_id);
CREATE INDEX idx_teams_leader_email ON teams USING gin(leader_email gin_trgm_ops);

-- Invitaciones
CREATE INDEX idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX idx_team_invitations_token ON team_invitations(unique_token);
CREATE INDEX idx_team_invitations_active ON team_invitations(is_active) WHERE is_active = true;

-- Sesiones
CREATE INDEX idx_invitation_sessions_expires_at ON invitation_sessions(expires_at);
CREATE INDEX idx_invitation_sessions_last_activity ON invitation_sessions(last_activity);

-- Evaluaciones
CREATE INDEX idx_evaluations_team_id ON evaluations(team_id);
CREATE INDEX idx_evaluations_invitation_id ON evaluations(invitation_id);
CREATE INDEX idx_evaluations_completed_at ON evaluations(completed_at);
CREATE INDEX idx_evaluations_role ON evaluations(evaluator_role);

-- Respuestas
CREATE INDEX idx_evaluation_responses_evaluation_id ON evaluation_responses(evaluation_id);
CREATE INDEX idx_evaluation_responses_question_id ON evaluation_responses(question_id);

-- ============================================================================
-- TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a todas las tablas con updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_question_templates_updated_at BEFORE UPDATE ON question_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_configurations_updated_at BEFORE UPDATE ON project_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_invitations_updated_at BEFORE UPDATE ON team_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitation_sessions_updated_at BEFORE UPDATE ON invitation_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluation_responses_updated_at BEFORE UPDATE ON evaluation_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCIONES DE UTILIDAD
-- ============================================================================

-- Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM invitation_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para generar estadísticas de evaluación
CREATE OR REPLACE FUNCTION get_evaluation_stats(project_uuid UUID)
RETURNS TABLE(
    team_name VARCHAR(255),
    total_invitations INTEGER,
    completed_evaluations INTEGER,
    completion_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.name as team_name,
        COUNT(DISTINCT ti.id)::INTEGER as total_invitations,
        COUNT(DISTINCT e.id)::INTEGER as completed_evaluations,
        CASE 
            WHEN COUNT(DISTINCT ti.id) > 0 
            THEN ROUND((COUNT(DISTINCT e.id)::DECIMAL / COUNT(DISTINCT ti.id) * 100), 2)
            ELSE 0.00
        END as completion_rate
    FROM teams t
    LEFT JOIN team_invitations ti ON t.id = ti.team_id AND ti.is_active = true
    LEFT JOIN evaluations e ON ti.id = e.invitation_id AND e.is_complete = true
    WHERE t.project_id = project_uuid
    GROUP BY t.id, t.name
    ORDER BY t.name;
END;
$$ LANGUAGE plpgsql;