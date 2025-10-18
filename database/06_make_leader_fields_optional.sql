-- ============================================================================
-- MIGRACIÓN: HACER CAMPOS DE LÍDER OPCIONALES
-- ============================================================================
-- Permite crear equipos sin datos del líder, que se completarán automáticamente
-- cuando el líder realice su primera evaluación
-- ============================================================================

-- 1. Eliminar la restricción de formato de email que está causando problemas
ALTER TABLE teams DROP CONSTRAINT IF EXISTS leader_email_format;

-- 2. Hacer los campos leader_name y leader_email opcionales (permitir NULL)
ALTER TABLE teams ALTER COLUMN leader_name DROP NOT NULL;
ALTER TABLE teams ALTER COLUMN leader_email DROP NOT NULL;

-- 3. Agregar nueva restricción de email más flexible (solo cuando no sea NULL)
ALTER TABLE teams ADD CONSTRAINT leader_email_format_optional 
CHECK (leader_email IS NULL OR leader_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 4. Agregar índice para búsquedas eficientes por email del líder
CREATE INDEX IF NOT EXISTS idx_teams_leader_email ON teams(leader_email) WHERE leader_email IS NOT NULL;

-- 5. Comentarios para documentar los cambios
COMMENT ON COLUMN teams.leader_name IS 'Nombre del líder del equipo. Se completa automáticamente cuando el líder realiza su primera evaluación.';
COMMENT ON COLUMN teams.leader_email IS 'Email del líder del equipo. Se completa automáticamente cuando el líder realiza su primera evaluación.';

-- 6. Función para actualizar información del líder automáticamente
CREATE OR REPLACE FUNCTION update_team_leader_info(
    p_team_id UUID,
    p_leader_name VARCHAR(255),
    p_leader_email VARCHAR(320)
) RETURNS BOOLEAN AS $$
BEGIN
    -- Solo actualizar si los campos están vacíos (primera vez que el líder completa evaluación)
    UPDATE teams 
    SET 
        leader_name = COALESCE(leader_name, p_leader_name),
        leader_email = COALESCE(leader_email, p_leader_email),
        updated_at = NOW()
    WHERE 
        id = p_team_id 
        AND (leader_name IS NULL OR leader_email IS NULL);
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Comentario en la función
COMMENT ON FUNCTION update_team_leader_info(UUID, VARCHAR(255), VARCHAR(320)) IS 
'Actualiza automáticamente la información del líder de un equipo cuando realiza su primera evaluación. Solo actualiza campos que están NULL.';