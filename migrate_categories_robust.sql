-- ============================================================================
-- MIGRACIÓN SUPABASE ROBUSTA: Cambiar columna category de string a JSON
-- ============================================================================
-- Script que maneja automáticamente los índices existentes
-- ============================================================================

-- PASO 1: Verificar estructura actual
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name = 'category';

-- PASO 2: Identificar todos los índices que usan la columna category
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'questions' 
AND indexdef ILIKE '%category%';

-- PASO 3: Eliminar todos los índices conocidos que pueden causar conflicto
-- Lista común de nombres de índices que Supabase puede crear automáticamente
DROP INDEX IF EXISTS idx_questions_category;
DROP INDEX IF EXISTS questions_category_idx;
DROP INDEX IF EXISTS category_idx;
DROP INDEX IF EXISTS questions_category_key;
DROP INDEX IF EXISTS questions_category_btree_idx;

-- PASO 4: Verificar que no quedan índices problemáticos
SELECT 
    indexname
FROM pg_indexes 
WHERE tablename = 'questions' 
AND indexdef ILIKE '%category%';

-- PASO 5: Cambiar tipo de columna de string/text a JSONB (más eficiente que JSON)
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

-- PASO 6: Crear índices optimizados para JSONB
-- Índice GIN para consultas generales en JSONB (más eficiente)
CREATE INDEX IF NOT EXISTS idx_questions_category_gin 
ON questions USING GIN (category);

-- PASO 7: Índice B-tree para nombre de categoría (expresión específica)
CREATE INDEX IF NOT EXISTS idx_questions_category_name 
ON questions ((category->>'name'));

-- PASO 8: Índice B-tree para ID de categoría
CREATE INDEX IF NOT EXISTS idx_questions_category_id 
ON questions ((category->>'id'));

-- PASO 9: Agregar comentario descriptivo
COMMENT ON COLUMN questions.category IS 'Información completa de la categoría en formato JSONB: {id, name, description, color}';

-- PASO 10: Verificar el cambio final
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name = 'category';

-- PASO 11: Verificar nuevos índices
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'questions' 
AND indexname LIKE '%category%';

-- PASO 12: Confirmación
SELECT 'Migración completada exitosamente. La columna category ahora es de tipo JSONB con índices optimizados.' as status;