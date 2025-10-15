-- ============================================================================
-- MIGRACIÓN SUPABASE: Cambiar columna category de string a JSON
-- ============================================================================
-- Script compatible con el editor SQL de Supabase
-- Ejecutar cada sección por separado si es necesario
-- ============================================================================

-- PASO 1: Verificar estructura actual de la columna category
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name = 'category';

-- PASO 2: Verificar datos existentes (si los hay)
SELECT 
    COUNT(*) as total_questions,
    COUNT(category) as questions_with_category,
    COUNT(DISTINCT category) as unique_categories
FROM questions;

-- PASO 2.5: Verificar y eliminar índices existentes en la columna category
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'questions' 
AND indexdef LIKE '%category%';

-- Eliminar cualquier índice existente en la columna category
DROP INDEX IF EXISTS idx_questions_category;
DROP INDEX IF EXISTS questions_category_idx;
DROP INDEX IF EXISTS category_idx;

-- PASO 3: Cambiar tipo de columna de string/text a JSON
ALTER TABLE questions 
ALTER COLUMN category TYPE JSON 
USING CASE 
    WHEN category IS NULL THEN NULL
    WHEN category = '' THEN NULL
    ELSE json_build_object(
        'id', category,
        'name', category,
        'description', '',
        'color', '#1976d2'
    )
END;

-- PASO 4: Crear índices optimizados
-- Índice GIN para consultas generales en JSON
CREATE INDEX IF NOT EXISTS idx_questions_category_gin 
ON questions USING GIN (category);

-- PASO 5: Índice B-tree para nombre de categoría
CREATE INDEX IF NOT EXISTS idx_questions_category_name 
ON questions ((category->>'name'));

-- PASO 6: Índice B-tree para ID de categoría
CREATE INDEX IF NOT EXISTS idx_questions_category_id 
ON questions ((category->>'id'));

-- PASO 7: Agregar comentario descriptivo
COMMENT ON COLUMN questions.category IS 'Información completa de la categoría en formato JSON: {id, name, description, color}';

-- PASO 8: Verificar el cambio
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name = 'category';

-- PASO 9: Verificar índices creados
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'questions' 
AND indexname LIKE '%category%';

-- PASO 10: Mensaje de confirmación
SELECT 'Migración completada exitosamente. La columna category ahora es de tipo JSON.' as status;