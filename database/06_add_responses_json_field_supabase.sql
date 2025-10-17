-- ============================================================================
-- MIGRACIÓN SUPABASE: AGREGAR CAMPO JSON PARA RESPUESTAS
-- ============================================================================
-- Versión optimizada para el SQL Editor de Supabase Dashboard
-- Ejecutar paso a paso en el editor SQL de Supabase
-- ============================================================================

-- PASO 1: Agregar campo responses_data JSONB a evaluations
ALTER TABLE evaluations 
ADD COLUMN responses_data JSONB DEFAULT '{}';

-- PASO 2: Agregar comentario explicativo
COMMENT ON COLUMN evaluations.responses_data IS 'Respuestas JSON: {"responses": {"question_id": {"value": any, "timestamp": "ISO_DATE"}}, "metadata": {"completion_time_seconds": number, "device_info": string}}';

-- PASO 3: Crear índices para búsquedas eficientes
CREATE INDEX idx_evaluations_responses_data 
ON evaluations USING GIN (responses_data);

CREATE INDEX idx_evaluations_responses_questions 
ON evaluations USING GIN ((responses_data -> 'responses'));

-- PASO 4: Crear función de migración (ejecutar todo junto)
CREATE OR REPLACE FUNCTION migrate_existing_responses_to_json()
RETURNS TABLE(
    evaluation_id uuid,
    responses_migrated integer,
    status text
) 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    eval_record RECORD;
    responses_json JSONB;
    response_record RECORD;
    response_count INTEGER;
BEGIN
    -- Procesar evaluaciones que no tienen datos JSON
    FOR eval_record IN 
        SELECT id FROM evaluations 
        WHERE responses_data = '{}'::jsonb OR responses_data IS NULL
        ORDER BY created_at
    LOOP
        -- Inicializar estructura JSON
        responses_json := jsonb_build_object(
            'responses', '{}'::jsonb, 
            'metadata', jsonb_build_object(
                'version', '2.0',
                'migrated_at', now(),
                'migration_source', 'supabase_dashboard'
            )
        );
        
        response_count := 0;
        
        -- Obtener respuestas existentes
        FOR response_record IN 
            SELECT question_id, response_value, response_text, created_at
            FROM evaluation_responses 
            WHERE evaluation_id = eval_record.id
            ORDER BY created_at
        LOOP
            -- Construir objeto de respuesta
            responses_json := jsonb_set(
                responses_json,
                array['responses', response_record.question_id::text],
                jsonb_build_object(
                    'value', CASE 
                        WHEN response_record.response_value IS NOT NULL 
                        THEN to_jsonb(response_record.response_value)
                        WHEN response_record.response_text IS NOT NULL 
                        THEN to_jsonb(response_record.response_text)
                        ELSE 'null'::jsonb
                    END,
                    'timestamp', to_jsonb(response_record.created_at),
                    'migrated', true
                ),
                true
            );
            response_count := response_count + 1;
        END LOOP;
        
        -- Actualizar evaluación solo si tiene respuestas
        IF response_count > 0 THEN
            UPDATE evaluations 
            SET responses_data = responses_json
            WHERE id = eval_record.id;
            
            -- Retornar resultado
            evaluation_id := eval_record.id;
            responses_migrated := response_count;
            status := 'migrated';
            RETURN NEXT;
        ELSE
            -- Retornar evaluación sin respuestas
            evaluation_id := eval_record.id;
            responses_migrated := 0;
            status := 'no_responses';
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- PASO 5: Crear funciones helper
CREATE OR REPLACE FUNCTION get_response_value(eval_responses_data JSONB, question_id TEXT)
RETURNS JSONB 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN eval_responses_data -> 'responses' -> question_id -> 'value';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_responses_json(responses_data JSONB)
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        responses_data IS NOT NULL AND
        responses_data ? 'responses' AND 
        responses_data ? 'metadata'
    );
END;
$$ LANGUAGE plpgsql;

-- PASO 6: Crear función para consultas de respuestas
CREATE OR REPLACE FUNCTION get_evaluation_responses(eval_id uuid)
RETURNS TABLE(
    question_id text,
    response_value jsonb,
    response_timestamp timestamptz
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        key as question_id,
        value -> 'value' as response_value,
        (value ->> 'timestamp')::timestamptz as response_timestamp
    FROM evaluations,
         jsonb_each(responses_data -> 'responses') as responses(key, value)
    WHERE evaluations.id = eval_id
    AND responses_data IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMANDOS PARA EJECUTAR DESPUÉS DE LA MIGRACIÓN
-- ============================================================================

-- MIGRAR DATOS EXISTENTES (ejecutar después de crear las funciones):
-- SELECT * FROM migrate_existing_responses_to_json();

-- VERIFICAR MIGRACIÓN:
-- SELECT 
--   id,
--   evaluator_email,
--   responses_data -> 'metadata' ->> 'version' as version,
--   jsonb_array_length(jsonb_object_keys(responses_data -> 'responses')) as response_count
-- FROM evaluations 
-- WHERE responses_data != '{}'::jsonb
-- ORDER BY created_at DESC
-- LIMIT 10;

-- CONSULTAR RESPUESTAS DE UNA EVALUACIÓN ESPECÍFICA:
-- SELECT * FROM get_evaluation_responses('EVALUATION_UUID_HERE');

-- BUSCAR EVALUACIONES POR RESPUESTA A PREGUNTA ESPECÍFICA:
-- SELECT 
--   id,
--   evaluator_name,
--   get_response_value(responses_data, 'QUESTION_UUID') as response
-- FROM evaluations
-- WHERE responses_data -> 'responses' ? 'QUESTION_UUID'
-- LIMIT 10;

-- ============================================================================
-- NOTAS IMPORTANTES PARA SUPABASE
-- ============================================================================
-- 1. Las funciones usan SECURITY DEFINER para trabajar con RLS
-- 2. Ejecutar paso a paso en el SQL Editor
-- 3. Verificar cada paso antes del siguiente
-- 4. La migración no elimina datos existentes (es segura)
-- 5. El sistema mantiene compatibilidad con evaluation_responses