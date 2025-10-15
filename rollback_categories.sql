-- ============================================================================
-- ROLLBACK: Revertir columna category de JSON a string
-- ============================================================================
-- Script para revertir la migración si es necesario
-- ============================================================================

-- 1. Verificar datos actuales
SELECT 
    id,
    category,
    category->>'name' as extracted_name
FROM questions 
WHERE category IS NOT NULL 
LIMIT 5;

-- 2. Eliminar índices JSON
DROP INDEX IF EXISTS idx_questions_category_gin;
DROP INDEX IF EXISTS idx_questions_category_name;
DROP INDEX IF EXISTS idx_questions_category_id;

-- 3. Revertir columna a tipo string/text
-- Extrae solo el nombre de la categoría del JSON
ALTER TABLE questions 
ALTER COLUMN category TYPE TEXT 
USING CASE 
    WHEN category IS NULL THEN NULL
    WHEN category::text = 'null' THEN NULL
    ELSE category->>'name'
END;

-- 4. Crear índice simple para strings
CREATE INDEX IF NOT EXISTS idx_questions_category_text 
ON questions (category);

-- 5. Actualizar comentario
COMMENT ON COLUMN questions.category IS 'Nombre de la categoría como texto simple';

-- 6. Verificar el rollback
\d questions

SELECT 'Rollback completado. Categorías revertidas a texto simple.' as status;