-- ============================================================================
-- MIGRACIÓN: Agregar template_id a evaluations para versionado inteligente
-- ============================================================================
-- Fecha: 17 de octubre de 2025
-- Propósito: Establecer relación directa entre evaluations y question_templates
--           para el sistema de versionado automático de cuestionarios
-- ============================================================================

-- 1. Agregar la columna template_id a la tabla evaluations
ALTER TABLE evaluations 
ADD COLUMN template_id UUID REFERENCES question_templates(id) ON DELETE RESTRICT;

-- 2. Crear índice para mejor performance
CREATE INDEX idx_evaluations_template_id ON evaluations(template_id);

-- 3. Poblar template_id para evaluaciones existentes
-- (Obtener template_id a través de la relación: evaluations → teams → projects → template_id)
UPDATE evaluations 
SET template_id = (
    SELECT p.template_id 
    FROM team_invitations ti
    JOIN teams t ON ti.team_id = t.id  
    JOIN projects p ON t.project_id = p.id
    WHERE ti.id = evaluations.invitation_id
)
WHERE template_id IS NULL;

-- 4. Hacer template_id NOT NULL después de poblar datos existentes
-- (Solo ejecutar si no hay evaluaciones con template_id NULL)
-- ALTER TABLE evaluations 
-- ALTER COLUMN template_id SET NOT NULL;

-- 5. Verificar que la migración fue exitosa
SELECT 
    'Migration Status' as check_type,
    COUNT(*) as total_evaluations,
    COUNT(template_id) as evaluations_with_template_id,
    CASE 
        WHEN COUNT(*) = COUNT(template_id) THEN 'SUCCESS: All evaluations have template_id'
        ELSE 'WARNING: Some evaluations missing template_id'
    END as migration_result
FROM evaluations;

-- ============================================================================
-- COMENTARIOS DE LA MIGRACIÓN
-- ============================================================================
/*
Esta migración permite:

1. **Versionado Automático**: Detectar cuando un cuestionario ya está siendo usado
2. **Preservación de Datos**: Mantener integridad histórica de evaluaciones
3. **Performance**: Consulta directa sin JOINs complejos
4. **Integridad**: Foreign key constraint protege contra eliminación accidental

Uso en el sistema:
- checkIfTemplateHasEvaluations(templateId) → COUNT(*) FROM evaluations WHERE template_id = templateId
- Crear nueva versión cuando existe al menos 1 evaluación
- Edición normal cuando no hay evaluaciones

La migración es backward-compatible y no afecta funcionalidad existente.
*/