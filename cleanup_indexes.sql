-- ============================================================================
-- DIAGNÓSTICO Y LIMPIEZA DE ÍNDICES: Preparar para migración JSON
-- ============================================================================
-- Script para identificar y eliminar índices que bloquean la migración
-- ============================================================================

-- PASO 1: Identificar TODOS los índices en la tabla questions
SELECT 
    indexname,
    indexdef,
    CASE 
        WHEN indexdef ILIKE '%category%' THEN 'PROBLEMÁTICO - Contiene category'
        ELSE 'OK - No afecta category'
    END as status
FROM pg_indexes 
WHERE tablename = 'questions'
ORDER BY status DESC, indexname;

-- PASO 2: Identificar específicamente índices en la columna category
SELECT 
    i.relname as index_name,
    a.attname as column_name,
    am.amname as access_method
FROM pg_class t,
     pg_class i,
     pg_index ix,
     pg_attribute a,
     pg_am am
WHERE t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND t.relkind = 'r'
    AND t.relname = 'questions'
    AND a.attname = 'category'
    AND i.relam = am.oid;

-- PASO 3: Generar comandos DROP para todos los índices de category
SELECT 
    'DROP INDEX IF EXISTS ' || indexname || ';' as drop_command
FROM pg_indexes 
WHERE tablename = 'questions' 
AND indexdef ILIKE '%category%';

-- PASO 4: Ejecutar limpieza completa (descomenta las líneas que necesites)
-- Basándote en el resultado del PASO 3, ejecuta los DROP necesarios

-- Ejemplos comunes:
-- DROP INDEX IF EXISTS idx_questions_category;
-- DROP INDEX IF EXISTS questions_category_idx; 
-- DROP INDEX IF EXISTS questions_category_btree;
-- DROP INDEX IF EXISTS questions_category_key;

-- PASO 5: Verificar limpieza
SELECT 
    COUNT(*) as indices_restantes_con_category
FROM pg_indexes 
WHERE tablename = 'questions' 
AND indexdef ILIKE '%category%';

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'LISTO - No hay índices problemáticos. Puedes proceder con la migración.'
        ELSE 'ATENCIÓN - Aún quedan ' || COUNT(*) || ' índices con category. Revisa el PASO 3.'
    END as resultado
FROM pg_indexes 
WHERE tablename = 'questions' 
AND indexdef ILIKE '%category%';