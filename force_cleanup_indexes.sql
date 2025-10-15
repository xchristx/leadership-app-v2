-- ============================================================================
-- LIMPIEZA AUTOMÁTICA: Eliminar índices problemáticos de category
-- ============================================================================
-- Script para eliminar todos los posibles índices problemáticos
-- ============================================================================

-- Eliminar índices comunes que Supabase puede crear automáticamente
DROP INDEX IF EXISTS questions_category_idx;
DROP INDEX IF EXISTS idx_questions_category;
DROP INDEX IF EXISTS questions_category_btree;
DROP INDEX IF EXISTS questions_category_key;
DROP INDEX IF EXISTS category_idx;
DROP INDEX IF EXISTS questions_category_pkey;
DROP INDEX IF EXISTS questions_category_unique;

-- Verificar que se eliminaron
SELECT 
    COUNT(*) as indices_restantes,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ LISTO - Todos los índices problemáticos eliminados'
        ELSE '⚠️ REVISAR - Aún quedan ' || COUNT(*) || ' índices'
    END as status
FROM pg_indexes 
WHERE tablename = 'questions' 
AND indexdef ILIKE '%category%';

-- Si aún quedan índices, mostrar cuáles son
SELECT 
    indexname,
    'DROP INDEX IF EXISTS ' || indexname || ';' as comando_eliminar
FROM pg_indexes 
WHERE tablename = 'questions' 
AND indexdef ILIKE '%category%';