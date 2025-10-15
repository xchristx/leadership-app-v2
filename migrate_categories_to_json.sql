-- ============================================================================
-- MIGRACIÓN: Cambiar columna category de string a JSON
-- ============================================================================
-- Este script migra la columna 'category' de la tabla 'questions' 
-- de tipo string a tipo JSON para almacenar información completa de categorías
-- ============================================================================

-- 1. Crear tabla temporal para respaldar los datos existentes (opcional)
-- NOTA: Si no hay datos existentes o ya fueron eliminados, esta tabla estará vacía
CREATE TABLE IF NOT EXISTS questions_backup AS 
SELECT * FROM questions WHERE category IS NOT NULL AND FALSE; -- Crear estructura vacía

-- 2. Mostrar datos antes de la migración (para verificación)
-- Si no hay datos, esta consulta no mostrará resultados
SELECT 
    id, 
    template_id, 
    category, 
    text_leader
FROM questions 
WHERE category IS NOT NULL 
ORDER BY template_id, category;

-- 3. Actualizar el tipo de columna de string a JSON
-- Nota: En PostgreSQL necesitamos usar una expresión para convertir string a JSON
ALTER TABLE questions 
ALTER COLUMN category TYPE JSON 
USING CASE 
    WHEN category IS NULL THEN NULL
    ELSE json_build_object(
        'id', category,
        'name', category,
        'description', '',
        'color', '#1976d2'
    )
END;

-- 4. Verificar la migración
SELECT 
    id,
    template_id,
    category,
    category->>'name' as category_name,
    category->>'color' as category_color,
    text_leader
FROM questions 
WHERE category IS NOT NULL 
ORDER BY template_id, category->>'name';

-- 5. Crear índices para mejorar performance en consultas de categorías
-- Índice GIN para búsquedas en todo el objeto JSON
CREATE INDEX IF NOT EXISTS idx_questions_category_gin 
ON questions USING GIN (category);

-- Índice B-tree específico para el nombre de la categoría
CREATE INDEX IF NOT EXISTS idx_questions_category_name 
ON questions ((category->>'name'));

-- Índice adicional para el ID de la categoría
CREATE INDEX IF NOT EXISTS idx_questions_category_id 
ON questions ((category->>'id'));

-- 6. Verificar que todo funciona correctamente
-- Contar preguntas por categoría
SELECT 
    template_id,
    category->>'name' as category_name,
    COUNT(*) as question_count
FROM questions 
WHERE category IS NOT NULL 
GROUP BY template_id, category->>'name'
ORDER BY template_id, category_name;

-- 7. Limpiar tabla temporal (opcional, descomenta si todo está bien)
-- DROP TABLE questions_backup;

COMMENT ON COLUMN questions.category IS 'Información completa de la categoría en formato JSON: {id, name, description, color}';