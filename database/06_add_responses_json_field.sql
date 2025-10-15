-- ============================================================================
-- MIGRACIÓN: AGREGAR CAMPO JSON PARA RESPUESTAS
-- ============================================================================
-- Agrega campo responses_data JSONB a tabla evaluations para almacenar
-- todas las respuestas en un solo campo JSON optimizado
-- ============================================================================

-- Agregar campo responses_data JSONB a evaluations
ALTER TABLE evaluations 
ADD COLUMN responses_data JSONB DEFAULT '{}';

-- Agregar comentario explicativo
COMMENT ON COLUMN evaluations.responses_data IS 'Respuestas de la evaluación almacenadas en formato JSON. Estructura: {"responses": {"question_id": {"value": any, "timestamp": "ISO_DATE"}}, "metadata": {"completion_time_seconds": number, "device_info": string}}';

-- Crear índice GIN para búsquedas eficientes en JSON
CREATE INDEX idx_evaluations_responses_data 
ON evaluations USING GIN (responses_data);

-- Crear índice para búsquedas por question_id específico
CREATE INDEX idx_evaluations_responses_questions 
ON evaluations USING GIN ((responses_data -> 'responses'));

-- Función auxiliar para migrar datos existentes (opcional)
CREATE OR REPLACE FUNCTION migrate_existing_responses_to_json()
RETURNS void AS $$
DECLARE
    eval_record RECORD;
    responses_json JSONB := '{}';
    response_record RECORD;
BEGIN
    -- Iterar sobre todas las evaluaciones que no tienen responses_data
    FOR eval_record IN 
        SELECT id FROM evaluations 
        WHERE responses_data = '{}'::jsonb OR responses_data IS NULL
    LOOP
        -- Inicializar JSON para esta evaluación
        responses_json := jsonb_build_object('responses', '{}'::jsonb, 'metadata', '{}'::jsonb);
        
        -- Obtener todas las respuestas para esta evaluación
        FOR response_record IN 
            SELECT question_id, response_value, response_text, created_at
            FROM evaluation_responses 
            WHERE evaluation_id = eval_record.id
        LOOP
            -- Agregar respuesta al JSON
            responses_json := jsonb_set(
                responses_json,
                array['responses', response_record.question_id::text],
                jsonb_build_object(
                    'value', CASE 
                        WHEN response_record.response_value IS NOT NULL THEN to_jsonb(response_record.response_value)
                        WHEN response_record.response_text IS NOT NULL THEN to_jsonb(response_record.response_text)
                        ELSE 'null'::jsonb
                    END,
                    'timestamp', to_jsonb(response_record.created_at)
                ),
                true
            );
        END LOOP;
        
        -- Actualizar la evaluación con el JSON construido
        UPDATE evaluations 
        SET responses_data = responses_json
        WHERE id = eval_record.id;
        
        -- Log del progreso
        RAISE NOTICE 'Migrated evaluation ID: %, responses count: %', 
                     eval_record.id, 
                     jsonb_object_keys(responses_json -> 'responses');
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Comentario sobre cómo usar la función de migración
COMMENT ON FUNCTION migrate_existing_responses_to_json() IS 'Migra respuestas existentes de evaluation_responses a campo JSON. Ejecutar: SELECT migrate_existing_responses_to_json();';

-- Política RLS para el nuevo campo (hereda las políticas existentes de evaluations)
-- No se requieren cambios adicionales en RLS ya que el campo pertenece a la tabla evaluations

-- Crear índices adicionales para consultas comunes
CREATE INDEX idx_evaluations_responses_count 
ON evaluations ((jsonb_object_keys_count(responses_data -> 'responses')));

-- Función helper para obtener valor de respuesta específica
CREATE OR REPLACE FUNCTION get_response_value(eval_responses_data JSONB, question_id TEXT)
RETURNS JSONB AS $$
BEGIN
    RETURN eval_responses_data -> 'responses' -> question_id -> 'value';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_response_value(JSONB, TEXT) IS 'Helper function para obtener el valor de una respuesta específica. Uso: SELECT get_response_value(responses_data, ''question_123'')';

-- Función helper para validar estructura JSON
CREATE OR REPLACE FUNCTION validate_responses_json(responses_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar que tiene la estructura correcta
    IF responses_data ? 'responses' AND responses_data ? 'metadata' THEN
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_responses_json(JSONB) IS 'Valida que responses_data tenga la estructura JSON correcta';

-- Restricción para validar estructura JSON (opcional, puede ser habilitada después)
-- ALTER TABLE evaluations 
-- ADD CONSTRAINT check_responses_data_structure 
-- CHECK (validate_responses_json(responses_data));

RAISE NOTICE 'Migration 06: responses_data JSONB field added successfully';
RAISE NOTICE 'To migrate existing data, run: SELECT migrate_existing_responses_to_json();';
RAISE NOTICE 'Remember to update your application code to use the new JSON field';