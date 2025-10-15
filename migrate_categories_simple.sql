-- ============================================================================
-- MIGRACIÓN SIMPLE: Cambiar columna category de string a JSON
-- ============================================================================
-- Script simplificado para migrar la columna 'category' cuando no hay datos
-- ============================================================================

-- 1. Verificar estructura actual
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name = 'category';

-- 2. Cambiar tipo de columna de string/text a JSON
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

-- 3. Crear índices optimizados
-- Índice GIN para consultas generales en JSON
CREATE INDEX IF NOT EXISTS idx_questions_category_gin 
ON questions USING GIN (category);

-- Índice B-tree para nombre de categoría (más eficiente para igualdad)
CREATE INDEX IF NOT EXISTS idx_questions_category_name 
ON questions ((category->>'name'));

-- Índice B-tree para ID de categoría
CREATE INDEX IF NOT EXISTS idx_questions_category_id 
ON questions ((category->>'id'));

-- 4. Agregar comentario descriptivo
COMMENT ON COLUMN questions.category IS 'Información completa de la categoría en formato JSON: {id, name, description, color}';

-- 5. Verificar el cambio
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND column_name = 'category';

-- 6. Probar inserción de datos JSON (opcional)
/*
INSERT INTO questions (
    template_id, 
    text_leader, 
    text_collaborator, 
    question_type, 
    category,
    order_index,
    is_active
) VALUES (
    'test-template-id',
    'Pregunta de prueba',
    'Test question',
    'likert',
    '{"id": "test-cat", "name": "Categoría de Prueba", "description": "Descripción de prueba", "color": "#ff5722"}',
    0,
    true
);

-- Verificar que se insertó correctamente
SELECT 
    category,
    category->>'name' as category_name,
    category->>'color' as category_color
FROM questions 
WHERE template_id = 'test-template-id';

-- Limpiar dato de prueba
DELETE FROM questions WHERE template_id = 'test-template-id';
*/

SELECT 'Migración completada exitosamente' as status;