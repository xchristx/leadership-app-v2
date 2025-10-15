-- ============================================================================
-- MIGRACIÓN SIMPLE JSONB: Sin índices complejos
-- ============================================================================
-- Script simplificado que evita problemas con índices GIN
-- ============================================================================

-- PASO 1: Verificar estructura actual
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name = 'category';

-- PASO 2: Cambiar tipo de columna de string/text a JSONB
ALTER TABLE questions 
ALTER COLUMN category TYPE JSONB 
USING CASE 
    WHEN category IS NULL THEN NULL
    WHEN category = '' THEN NULL
    ELSE json_build_object(
        'id', category,
        'name', category,
        'description', '',
        'color', '#1976d2'
    )::jsonb
END;

-- PASO 3: Crear solo índices B-tree simples (más compatibles)
-- Índice para nombre de categoría
CREATE INDEX IF NOT EXISTS idx_questions_category_name 
ON questions ((category->>'name'));

-- Índice para ID de categoría
CREATE INDEX IF NOT EXISTS idx_questions_category_id 
ON questions ((category->>'id'));

-- PASO 4: Agregar comentario descriptivo
COMMENT ON COLUMN questions.category IS 'Información completa de la categoría en formato JSONB: {id, name, description, color}';

-- PASO 5: Verificar el cambio final
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name = 'category';

-- PASO 6: Verificar índices creados
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'questions' 
AND indexname LIKE '%category%';

-- PASO 7: Probar funcionalidad básica
SELECT 'Migración completada. Columna category ahora es JSONB con índices básicos.' as status;