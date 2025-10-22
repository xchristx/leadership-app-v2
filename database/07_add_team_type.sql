-- ============================================================================
-- MIGRACIÓN: Agregar campo team_type a tabla teams
-- ============================================================================
-- Permite diferenciar entre equipos regulares y equipos de liderazgo de proyecto
-- ============================================================================

-- Agregar columna team_type con valores permitidos
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS team_type VARCHAR(50) DEFAULT 'regular' 
  CHECK (team_type IN ('regular', 'project_leadership'));

-- Crear índice para mejorar consultas por tipo de equipo
CREATE INDEX IF NOT EXISTS idx_teams_team_type ON teams(team_type);

-- Crear índice compuesto para consultas por proyecto y tipo
CREATE INDEX IF NOT EXISTS idx_teams_project_type ON teams(project_id, team_type);

-- Comentarios para documentación
COMMENT ON COLUMN teams.team_type IS 'Tipo de equipo: regular (equipo normal) o project_leadership (evaluación de liderazgo del proyecto)';
