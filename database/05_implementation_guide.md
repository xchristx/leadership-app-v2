# CONSIDERACIONES DE IMPLEMENTACIÓN

## FLUJO DE INVITACIONES SIN AUTENTICACIÓN

### 1. Arquitectura de Acceso Público

El sistema está diseñado para permitir evaluaciones sin requerir que los participantes creen cuentas o se autentiquen. Esto se logra mediante:

#### **Tokens Únicos**
```sql
-- Cada invitación tiene un token único de 64 caracteres
unique_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex')
```

#### **URLs de Invitación**
```
https://tu-app.com/evaluate/{unique_token}
```

#### **Flujo de Acceso**
1. **Administrador** crea equipo → Se generan automáticamente 2 invitaciones (líder + colaborador)
2. **Links se comparten** via email, WhatsApp, etc.
3. **Evaluador accede** al link → Ingresa nombre/email → Inicia evaluación
4. **Sesión temporal** se crea automáticamente → Evaluador puede completar en múltiples sesiones
5. **Evaluación se completa** → Datos quedan guardados para análisis

### 2. Manejo de Sesiones Temporales

#### **Tabla `invitation_sessions`**
- Almacena estado temporal para evaluadores no autenticados
- Expira automáticamente después de 24 horas
- Permite retomar evaluaciones parciales

#### **Implementación en React**
```typescript
// Guardar estado en sessionStorage como respaldo
const saveSessionState = (sessionData: any) => {
  sessionStorage.setItem(`evaluation_${sessionData.session_id}`, JSON.stringify({
    ...sessionData,
    lastActivity: Date.now()
  }))
}

// Recuperar sesión si el usuario vuelve
const recoverSession = (sessionId: string) => {
  const saved = sessionStorage.getItem(`evaluation_${sessionId}`)
  if (saved) {
    const data = JSON.parse(saved)
    // Verificar si la sesión no ha expirado (< 24h)
    if (Date.now() - data.lastActivity < 24 * 60 * 60 * 1000) {
      return data
    }
  }
  return null
}
```

### 3. Estrategia para Múltiples Dispositivos

#### **Identificación por Email**
```sql
-- El sistema permite múltiples evaluaciones del mismo email si está configurado
CONSTRAINT unique_evaluator_per_invitation 
UNIQUE(invitation_id, evaluator_email) DEFERRABLE
```

#### **Re-evaluación Controlada**
- Configuración por proyecto: `allow_re_evaluation`
- Si está permitido: el mismo evaluador puede completar múltiples veces
- Si no está permitido: se bloquea después de la primera evaluación completa

## ESTRATEGIA PARA ANÁLISIS DE DATOS

### 1. Estructura Optimizada para Visualización

#### **Datos Pre-agregados en Vistas**
```sql
-- Vista para análisis rápido por equipo
CREATE VIEW team_evaluation_summary AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.project_id,
    COUNT(DISTINCT e.id) as total_evaluations,
    COUNT(DISTINCT CASE WHEN e.evaluator_role = 'leader' THEN e.id END) as leader_evaluations,
    COUNT(DISTINCT CASE WHEN e.evaluator_role = 'collaborator' THEN e.id END) as collaborator_evaluations,
    AVG(CASE WHEN e.evaluator_role = 'leader' THEN er.response_value END) as leader_avg_score,
    AVG(CASE WHEN e.evaluator_role = 'collaborator' THEN er.response_value END) as collaborator_avg_score,
    MAX(e.completed_at) as last_evaluation_date
FROM teams t
LEFT JOIN evaluations e ON e.team_id = t.id AND e.is_complete = true
LEFT JOIN evaluation_responses er ON er.evaluation_id = e.id
GROUP BY t.id, t.name, t.project_id;
```

#### **Índices para Performance en Consultas Analíticas**
```sql
-- Índice compuesto para consultas por proyecto y fecha
CREATE INDEX idx_evaluations_analytics 
ON evaluations(team_id, evaluator_role, completed_at) 
WHERE is_complete = true;

-- Índice para respuestas por categoría
CREATE INDEX idx_responses_by_category 
ON evaluation_responses(evaluation_id, question_id) 
INCLUDE (response_value);
```

### 2. Pipelines de Datos para Dashboard

#### **Funciones SQL Optimizadas**
```sql
-- Función para obtener datos del dashboard de manera eficiente
CREATE OR REPLACE FUNCTION get_project_analytics_fast(p_project_id UUID)
RETURNS TABLE(
    metric_type TEXT,
    category TEXT,
    leader_score DECIMAL(5,2),
    collaborator_score DECIMAL(5,2),
    response_count INTEGER,
    team_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH evaluation_stats AS (
        SELECT 
            COALESCE(q.category, 'General') as cat,
            e.evaluator_role,
            AVG(er.response_value) as avg_score,
            COUNT(er.id) as responses,
            COUNT(DISTINCT e.team_id) as teams
        FROM teams t
        JOIN evaluations e ON e.team_id = t.id AND e.is_complete = true
        JOIN evaluation_responses er ON er.evaluation_id = e.id
        JOIN questions q ON q.id = er.question_id
        WHERE t.project_id = p_project_id
        GROUP BY q.category, e.evaluator_role
    )
    SELECT 
        'category_analysis'::TEXT,
        es_leader.cat,
        ROUND(es_leader.avg_score, 2) as leader_score,
        ROUND(COALESCE(es_collab.avg_score, 0), 2) as collaborator_score,
        (es_leader.responses + COALESCE(es_collab.responses, 0))::INTEGER,
        es_leader.teams::INTEGER
    FROM evaluation_stats es_leader
    LEFT JOIN evaluation_stats es_collab ON es_collab.cat = es_leader.cat AND es_collab.evaluator_role = 'collaborator'
    WHERE es_leader.evaluator_role = 'leader';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### **Caché en React para Performance**
```typescript
// hook personalizado con caché inteligente
export const useCachedAnalytics = (projectId: string) => {
  const [cache, setCache] = useState<Map<string, { data: any; timestamp: number }>>(new Map())
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

  const getCachedData = async (key: string, fetchFn: () => Promise<any>) => {
    const cached = cache.get(key)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      return cached.data
    }
    
    const data = await fetchFn()
    setCache(prev => new Map(prev).set(key, { data, timestamp: now }))
    return data
  }

  const getProjectAnalytics = () => getCachedData(
    `analytics_${projectId}`, 
    () => supabase.rpc('get_project_analytics_fast', { p_project_id: projectId })
  )

  return { getProjectAnalytics, clearCache: () => setCache(new Map()) }
}
```

### 3. Exportación y Backup de Datos

#### **Función de Exportación Completa**
```sql
CREATE OR REPLACE FUNCTION export_project_complete(p_project_id UUID)
RETURNS TABLE(
    export_type TEXT,
    team_data JSONB,
    evaluation_data JSONB,
    summary_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    -- Datos de equipos
    SELECT 
        'teams'::TEXT,
        jsonb_agg(jsonb_build_object(
            'id', t.id,
            'name', t.name,
            'leader_name', t.leader_name,
            'leader_email', t.leader_email,
            'department', t.department,
            'created_at', t.created_at
        )) as team_data,
        NULL::JSONB as evaluation_data,
        NULL::JSONB as summary_data
    FROM teams t
    WHERE t.project_id = p_project_id
    
    UNION ALL
    
    -- Datos de evaluaciones
    SELECT 
        'evaluations'::TEXT,
        NULL::JSONB,
        jsonb_agg(jsonb_build_object(
            'team_id', e.team_id,
            'evaluator_name', e.evaluator_name,
            'evaluator_email', e.evaluator_email,
            'evaluator_role', e.evaluator_role,
            'completed_at', e.completed_at,
            'responses', (
                SELECT jsonb_agg(jsonb_build_object(
                    'question_id', er.question_id,
                    'response_value', er.response_value,
                    'response_text', er.response_text
                ))
                FROM evaluation_responses er
                WHERE er.evaluation_id = e.id
            )
        )) as evaluation_data,
        NULL::JSONB
    FROM evaluations e
    JOIN teams t ON t.id = e.team_id
    WHERE t.project_id = p_project_id
    AND e.is_complete = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## SEGURIDAD Y PRIVACIDAD

### 1. Protección de Datos Personales

#### **Encriptación de Emails Sensibles**
```sql
-- Extensión para encriptación (opcional)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función para hash de emails para analytics anónimos
CREATE OR REPLACE FUNCTION hash_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(digest(email || current_setting('app.email_salt'), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Vista anonimizada para reportes
CREATE VIEW anonymous_evaluation_data AS
SELECT 
    e.id,
    e.team_id,
    hash_email(e.evaluator_email) as evaluator_hash,
    e.evaluator_role,
    e.completed_at,
    er.question_id,
    er.response_value
FROM evaluations e
JOIN evaluation_responses er ON er.evaluation_id = e.id
WHERE e.is_complete = true;
```

### 2. Auditoría y Logging

#### **Tabla de Auditoría**
```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger función para auditoría automática
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        table_name, operation, record_id, old_values, new_values, user_id
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        auth.uid()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar auditoría a tablas críticas
CREATE TRIGGER audit_evaluations 
    AFTER INSERT OR UPDATE OR DELETE ON evaluations 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

## ESCALABILIDAD Y PERFORMANCE

### 1. Particionamiento por Organización

```sql
-- Partición de la tabla de evaluaciones por organización (para proyectos muy grandes)
CREATE TABLE evaluations_partitioned (
    LIKE evaluations INCLUDING ALL
) PARTITION BY HASH (organization_id);

-- Crear particiones
CREATE TABLE evaluations_part_0 PARTITION OF evaluations_partitioned
FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE evaluations_part_1 PARTITION OF evaluations_partitioned
FOR VALUES WITH (MODULUS 4, REMAINDER 1);

-- ... más particiones según el volumen
```

### 2. Índices Especializados

```sql
-- Índice para búsquedas de texto completo
CREATE INDEX idx_teams_search ON teams USING gin(
    to_tsvector('spanish', name || ' ' || COALESCE(department, ''))
);

-- Índice parcial para evaluaciones activas
CREATE INDEX idx_active_evaluations ON evaluations (team_id, created_at)
WHERE is_complete = false;

-- Índice para consultas de fecha range
CREATE INDEX idx_evaluations_date_range ON evaluations (completed_at)
WHERE completed_at IS NOT NULL;
```

### 3. Configuración de Pool de Conexiones

```typescript
// supabase-config-advanced.ts
export const supabaseConfig = {
  // Configuración del pool de conexiones
  db: {
    poolSize: 20,
    idleTimeout: 30000,
    connectionTimeout: 20000
  },
  
  // Configuración de retry
  retry: {
    attempts: 3,
    delay: 1000,
    multiplier: 2
  },
  
  // Configuración de caché
  cache: {
    defaultTTL: 300, // 5 minutos
    maxSize: 100     // máximo 100 entradas en caché
  }
}
```

## MONITOREO Y MANTENIMIENTO

### 1. Métricas de Sistema

```sql
-- Función para obtener métricas de salud del sistema
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS TABLE(
    metric VARCHAR(50),
    value BIGINT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'active_evaluations'::VARCHAR(50), COUNT(*)::BIGINT, 'Evaluaciones en progreso'::TEXT
    FROM evaluations WHERE is_complete = false
    
    UNION ALL
    
    SELECT 'expired_sessions'::VARCHAR(50), COUNT(*)::BIGINT, 'Sesiones expiradas'::TEXT
    FROM invitation_sessions WHERE expires_at < NOW()
    
    UNION ALL
    
    SELECT 'total_responses'::VARCHAR(50), COUNT(*)::BIGINT, 'Respuestas totales'::TEXT
    FROM evaluation_responses
    
    UNION ALL
    
    SELECT 'db_size_mb'::VARCHAR(50), 
           (pg_database_size(current_database()) / 1024 / 1024)::BIGINT, 
           'Tamaño de base de datos en MB'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Tareas de Mantenimiento Automático

```sql
-- Función para ejecutar como cron job diario
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS TABLE(
    task VARCHAR(50),
    items_processed INTEGER,
    status TEXT
) AS $$
DECLARE
    cleaned_sessions INTEGER;
    expired_invitations INTEGER;
BEGIN
    -- Limpiar sesiones expiradas
    DELETE FROM invitation_sessions WHERE expires_at < NOW() - INTERVAL '1 day';
    GET DIAGNOSTICS cleaned_sessions = ROW_COUNT;
    
    -- Desactivar invitaciones muy antigas
    UPDATE team_invitations 
    SET is_active = false 
    WHERE expires_at < NOW() - INTERVAL '7 days' AND is_active = true;
    GET DIAGNOSTICS expired_invitations = ROW_COUNT;
    
    -- Actualizar estadísticas de tablas
    ANALYZE teams, evaluations, evaluation_responses;
    
    -- Retornar resumen
    RETURN QUERY
    SELECT 'cleanup_sessions'::VARCHAR(50), cleaned_sessions, 'OK'::TEXT
    UNION ALL
    SELECT 'expire_invitations'::VARCHAR(50), expired_invitations, 'OK'::TEXT
    UNION ALL
    SELECT 'update_statistics'::VARCHAR(50), 0, 'OK'::TEXT;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 'maintenance_error'::VARCHAR(50), 0, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Alertas y Notificaciones

```typescript
// sistema de alertas en el frontend
export const useSystemAlerts = () => {
  const checkSystemHealth = async () => {
    const { data } = await supabase.rpc('get_system_health')
    
    const alerts = []
    
    // Verificar si hay muchas evaluaciones sin completar
    const activeEvals = data.find(m => m.metric === 'active_evaluations')?.value || 0
    if (activeEvals > 100) {
      alerts.push({
        type: 'warning',
        message: `Hay ${activeEvals} evaluaciones sin completar`,
        action: 'review_pending_evaluations'
      })
    }
    
    // Verificar sesiones expiradas
    const expiredSessions = data.find(m => m.metric === 'expired_sessions')?.value || 0
    if (expiredSessions > 50) {
      alerts.push({
        type: 'info',
        message: `${expiredSessions} sesiones pueden ser limpiadas`,
        action: 'run_cleanup'
      })
    }
    
    return alerts
  }
  
  return { checkSystemHealth }
}
```

## PRÓXIMOS PASOS RECOMENDADOS

### 1. Implementación por Fases

**Fase 1: Core (2-3 semanas)**
- [ ] Setup inicial de Supabase
- [ ] Implementar esquema base (tablas principales)
- [ ] RLS básico
- [ ] API para CRUD de organizaciones y plantillas

**Fase 2: Evaluaciones (3-4 semanas)**  
- [ ] Sistema de invitaciones públicas
- [ ] Flujo de evaluación sin auth
- [ ] Sesiones temporales
- [ ] Guardado de respuestas

**Fase 3: Analytics (2-3 semanas)**
- [ ] Dashboard de proyectos  
- [ ] Reportes por equipo
- [ ] Exportación de datos
- [ ] Visualizaciones con Chart.js/D3

**Fase 4: Optimización (1-2 semanas)**
- [ ] Índices adicionales
- [ ] Caché inteligente
- [ ] Compresión de datos históricos
- [ ] Monitoreo y alertas

### 2. Configuración de Supabase

```sql
-- Variables de entorno recomendadas
-- En Supabase Dashboard > Settings > API
JWT_SECRET: [generated-secret]
JWT_EXP: 3600
DB_ANON_ROLE: anon
DB_SERVICE_ROLE: service_role

-- Custom Claims para JWT
-- En Supabase Auth Hooks
{
  "organization_id": "user_metadata.organization_id",
  "role": "user_metadata.role"
}
```

Este diseño proporciona una base sólida, escalable y segura para el sistema de evaluación de equipos, con consideraciones detalladas para cada aspecto crítico de la implementación.