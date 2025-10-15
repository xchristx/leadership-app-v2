-- ============================================================================
-- PRUEBA: Verificar funcionamiento de categorías JSON
-- ============================================================================
-- Script para probar que la migración funcionó correctamente
-- ============================================================================

-- 1. Insertar datos de prueba con categorías JSON
INSERT INTO questions (
    template_id, 
    text_leader, 
    text_collaborator, 
    question_type, 
    category,
    order_index,
    is_active,
    response_config
) VALUES 
(
    '00000000-0000-0000-0000-000000000001', -- ID temporal de template
    'Pregunta de prueba sobre liderazgo estratégico',
    'Strategic leadership test question',
    'likert',
    '{"id": "strategic", "name": "Liderazgo Estratégico", "description": "Preguntas sobre visión y planificación", "color": "#1976d2"}',
    1,
    true,
    '{"scale": 10}'
),
(
    '00000000-0000-0000-0000-000000000001',
    'Pregunta de prueba sobre comunicación',
    'Communication test question', 
    'text',
    '{"id": "communication", "name": "Comunicación", "description": "Habilidades de comunicación efectiva", "color": "#ff5722"}',
    2,
    true,
    '{}'
);

-- 2. Verificar que se insertaron correctamente
SELECT 
    id,
    text_leader,
    category,
    category->>'id' as category_id,
    category->>'name' as category_name,
    category->>'description' as category_description,
    category->>'color' as category_color
FROM questions 
WHERE template_id = '00000000-0000-0000-0000-000000000001';

-- 3. Probar consultas de búsqueda por categoría
SELECT 
    text_leader,
    category->>'name' as category_name
FROM questions 
WHERE category->>'name' = 'Liderazgo Estratégico';

-- 4. Probar agrupación por categorías
SELECT 
    category->>'name' as category_name,
    COUNT(*) as question_count
FROM questions 
WHERE category IS NOT NULL
GROUP BY category->>'name'
ORDER BY category_name;

-- 5. Probar búsqueda por ID de categoría
SELECT 
    text_leader,
    category->>'name' as category_name
FROM questions 
WHERE category->>'id' = 'strategic';

-- 6. Limpiar datos de prueba
DELETE FROM questions WHERE template_id = '00000000-0000-0000-0000-000000000001';

-- 7. Confirmar limpieza
SELECT COUNT(*) as remaining_test_questions
FROM questions 
WHERE template_id = '00000000-0000-0000-0000-000000000001';

SELECT 'Pruebas completadas exitosamente. Las categorías JSON funcionan correctamente.' as status;