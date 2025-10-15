-- ============================================================================
-- CONFIGURACIÓN INICIAL PARA SUPABASE
-- ============================================================================
-- Este archivo debe ejecutarse ANTES de las políticas RLS
-- Contiene configuraciones específicas para el entorno de Supabase
-- ============================================================================

-- ============================================================================
-- 1. CONFIGURACIÓN DEL SCHEMA AUTH (Si tienes acceso como service_role)
-- ============================================================================

-- Solo ejecutar si tienes permisos de service_role
-- ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

-- ============================================================================
-- 2. CONFIGURACIÓN DE VARIABLES PERSONALIZADAS
-- ============================================================================

-- Variable para el salt del hash de emails (cambiar por un valor único en producción)
-- SELECT set_config('app.email_salt', 'tu_salt_secreto_aqui_' || extract(epoch from now())::text, false);

-- ============================================================================
-- 3. GRANTS ADICIONALES PARA FUNCIONES
-- ============================================================================

-- Otorgar permisos para que las funciones puedan ser ejecutadas por usuarios anónimos y autenticados
GRANT EXECUTE ON FUNCTION get_user_organization_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_organization_admin() TO authenticated;

-- ============================================================================
-- 4. CONFIGURACIÓN DE JWT PERSONALIZADO
-- ============================================================================

/*
Para configurar los JWT custom claims en Supabase:

1. Ve a Authentication > Settings en tu dashboard de Supabase
2. En "Additional Settings" > "JWT Template" agrega:

{
  "aal": "{{ .user.aal }}",
  "aud": "{{ .user.aud }}",
  "email": "{{ .user.email }}",
  "exp": {{ .user.exp }},
  "iat": {{ .user.iat }},
  "iss": "{{ .user.iss }}",
  "phone": "{{ .user.phone }}",
  "role": "{{ .user.role }}",
  "sub": "{{ .user.id }}",
  "organization_id": "{{ .user.user_metadata.organization_id }}",
  "user_role": "{{ .user.user_metadata.role }}"
}

3. O usando SQL para actualizar user metadata:
*/

-- Función para actualizar metadata de usuario (solo para desarrollo)
CREATE OR REPLACE FUNCTION update_user_organization(
    user_id UUID,
    org_id UUID,
    user_role TEXT DEFAULT 'admin'
) RETURNS BOOLEAN AS $$
BEGIN
    -- Actualizar la tabla users
    UPDATE users 
    SET organization_id = org_id, role = user_role 
    WHERE id = user_id;
    
    -- Nota: El metadata del JWT debe ser actualizado desde el lado del cliente
    -- usando supabase.auth.updateUser({ data: { organization_id: org_id, role: user_role }})
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_user_organization(UUID, UUID, TEXT) TO authenticated;

-- ============================================================================
-- 5. FUNCIÓN PARA SETUP INICIAL DE ORGANIZACIÓN
-- ============================================================================

-- Función para crear organización inicial (bypass RLS temporalmente)
CREATE OR REPLACE FUNCTION create_initial_organization(
    org_name TEXT,
    subdomain TEXT,
    admin_email TEXT,
    admin_name TEXT
) RETURNS UUID AS $$
DECLARE
    org_id UUID;
    user_id UUID;
BEGIN
    -- Obtener ID del usuario actual
    SELECT auth.uid() INTO user_id;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Must be authenticated to create organization';
    END IF;
    
    -- Crear organización (bypass RLS temporalmente)
    SET LOCAL row_security = off;
    
    INSERT INTO organizations (name, subdomain)
    VALUES (org_name, subdomain)
    RETURNING id INTO org_id;
    
    -- Crear usuario admin
    INSERT INTO users (id, organization_id, email, role, first_name)
    VALUES (user_id, org_id, admin_email, 'admin', admin_name)
    ON CONFLICT (id) DO UPDATE SET 
        organization_id = EXCLUDED.organization_id,
        role = EXCLUDED.role;
    
    SET LOCAL row_security = on;
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_initial_organization(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 6. FUNCIÓN PARA ACCESO PÚBLICO A INVITACIONES
-- ============================================================================

-- Función para obtener datos de invitación sin autenticación
CREATE OR REPLACE FUNCTION get_invitation_data(invitation_token TEXT)
RETURNS TABLE(
    invitation_id UUID,
    team_id UUID,
    team_name TEXT,
    role_type TEXT,
    project_name TEXT,
    is_valid BOOLEAN,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ti.id as invitation_id,
        ti.team_id,
        t.name as team_name,
        ti.role_type,
        p.name as project_name,
        ti.is_active as is_valid,
        ti.expires_at
    FROM team_invitations ti
    JOIN teams t ON t.id = ti.team_id
    JOIN projects p ON p.id = t.project_id
    WHERE ti.unique_token = invitation_token
    AND ti.is_active = true
    AND (ti.expires_at IS NULL OR ti.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir acceso público a esta función
GRANT EXECUTE ON FUNCTION get_invitation_data(TEXT) TO anon, authenticated;

-- ============================================================================
-- 7. CONFIGURACIONES DE SEGURIDAD ADICIONALES
-- ============================================================================

-- Función para validar tokens de invitación
CREATE OR REPLACE FUNCTION is_valid_invitation_token(token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM team_invitations 
        WHERE unique_token = token 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO invitation_exists;
    
    RETURN invitation_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_valid_invitation_token(TEXT) TO anon, authenticated;

-- ============================================================================
-- 8. POLÍTICAS ADICIONALES PARA ACCESO PÚBLICO
-- ============================================================================

-- Política para permitir SELECT en team_invitations con token válido (acceso anónimo)
CREATE POLICY "Public access to invitations with valid token"
    ON team_invitations FOR SELECT
    TO anon
    USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Política para permitir INSERT en evaluations con token válido (acceso anónimo)
CREATE POLICY "Public can create evaluations with valid token"
    ON evaluations FOR INSERT
    TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_invitations ti
            WHERE ti.id = evaluations.invitation_id
            AND ti.is_active = true
            AND (ti.expires_at IS NULL OR ti.expires_at > NOW())
        )
    );

-- Política para permitir INSERT en evaluation_responses (acceso anónimo)
CREATE POLICY "Public can create responses with valid evaluation"
    ON evaluation_responses FOR INSERT
    TO anon
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM evaluations e
            JOIN team_invitations ti ON ti.id = e.invitation_id
            WHERE e.id = evaluation_responses.evaluation_id
            AND ti.is_active = true
            AND (ti.expires_at IS NULL OR ti.expires_at > NOW())
        )
    );

-- Política para permitir UPDATE en evaluations (acceso anónimo)
CREATE POLICY "Public can update own evaluations"
    ON evaluations FOR UPDATE
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM team_invitations ti
            WHERE ti.id = evaluations.invitation_id
            AND ti.is_active = true
            AND (ti.expires_at IS NULL OR ti.expires_at > NOW())
        )
    );

-- Política para permitir UPDATE en evaluation_responses (acceso anónimo)
CREATE POLICY "Public can update own responses"
    ON evaluation_responses FOR UPDATE
    TO anon
    USING (
        EXISTS (
            SELECT 1 FROM evaluations e
            JOIN team_invitations ti ON ti.id = e.invitation_id
            WHERE e.id = evaluation_responses.evaluation_id
            AND ti.is_active = true
            AND (ti.expires_at IS NULL OR ti.expires_at > NOW())
        )
    );

-- ============================================================================
-- COMENTARIOS FINALES
-- ============================================================================

/*
ORDEN DE EJECUCIÓN RECOMENDADO:

1. 01_schema.sql (crear todas las tablas)
2. 00_supabase_setup.sql (este archivo - configuraciones iniciales)
3. 02_rls_policies.sql (políticas RLS corregidas)
4. 03_functions.sql (funciones de negocio)

CONFIGURACIÓN POST-INSTALACIÓN:

1. Crear organización inicial usando create_initial_organization()
2. Actualizar JWT template en Supabase Dashboard
3. Configurar variables de entorno en tu aplicación React
4. Probar el flujo de invitaciones públicas

NOTAS DE SEGURIDAD:

- Las políticas de acceso anónimo están diseñadas para ser restrictivas
- Solo permiten operaciones con tokens válidos y activos
- El acceso está limitado a las operaciones específicas de evaluación
- Los datos de organizaciones permanecen completamente aislados
*/