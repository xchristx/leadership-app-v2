# SISTEMA DE EVALUACIÓN DE EQUIPOS - DISEÑO DE BASE DE DATOS

## RESUMEN EJECUTIVO

Este documento presenta el diseño completo de base de datos para un **Sistema de Evaluación de Equipos Organizacionales** con **Supabase + PostgreSQL**. El sistema permite evaluaciones de liderazgo con 2-3 niveles jerárquicos, utilizando cuestionarios adaptables y enlaces únicos sin autenticación compleja.

### CARACTERÍSTICAS PRINCIPALES

- ✅ **Multitenancy** por organización
- ✅ **Evaluaciones sin autenticación** (enlaces únicos)
- ✅ **Cuestionarios adaptables** por rol (líder/colaborador)  
- ✅ **Sesiones temporales** para usuarios no autenticados
- ✅ **Análisis y reportes** con datos estructurados
- ✅ **Escalabilidad** y performance optimizada
- ✅ **Seguridad RLS** completa

## ESTRUCTURA DEL PROYECTO

```
database/
├── 00_entity_relationship_diagram.md    # Modelo conceptual completo
├── 01_schema.sql                        # DDL: Tablas, índices, constraints
├── 02_rls_policies.sql                  # Políticas Row Level Security  
├── 03_functions.sql                     # Funciones PostgreSQL especializadas
├── 04_api_patterns.md                   # Patrones de uso con Supabase JS
├── 05_implementation_guide.md           # Consideraciones técnicas detalladas
└── README.md                           # Este archivo
```

## FLUJO DE DATOS PRINCIPAL

```
ORGANIZACIÓN → PLANTILLAS → PROYECTOS → EQUIPOS → INVITACIONES → EVALUACIONES → ANÁLISIS
```

### 1. **CONFIGURACIÓN INICIAL**
- Organización crea plantillas de cuestionarios
- Define preguntas con texto adaptable (líder vs colaborador)
- Configura categorías opcionales

### 2. **GESTIÓN DE PROYECTOS**  
- Crea proyecto basado en plantilla
- Configura niveles jerárquicos (2 o 3)
- Define equipos con líder y colaboradores

### 3. **INVITACIONES PÚBLICAS**
- Sistema genera enlaces únicos por equipo/rol
- No requiere registro de usuarios evaluadores  
- Sesiones temporales para evaluaciones parciales

### 4. **PROCESO DE EVALUACIÓN**
- Evaluador accede via enlace → ingresa datos básicos
- Responde cuestionario adaptado a su rol
- Puede guardar progreso y continuar después
- Sistema valida completitud automáticamente

### 5. **ANÁLISIS Y REPORTES**
- Dashboard con métricas por proyecto
- Comparaciones entre equipos y roles
- Exportación de datos para análisis externos
- Visualizaciones ready-to-use

## ENTIDADES PRINCIPALES

| Entidad | Propósito | Campos Clave |
|---------|-----------|--------------|
| **organizations** | Multitenancy | `subdomain`, `settings` |
| **question_templates** | Plantillas reutilizables | `title`, `version_type` |
| **questions** | Preguntas adaptables | `text_leader`, `text_collaborator`, `category` |
| **projects** | Contenedor de evaluaciones | `hierarchy_levels`, `status` |
| **teams** | Unidad de evaluación | `leader_name`, `leader_email` |
| **team_invitations** | Enlaces únicos | `unique_token`, `role_type`, `expires_at` |
| **evaluations** | Evaluación completada | `evaluator_name`, `evaluator_role` |
| **evaluation_responses** | Respuestas individuales | `response_value`, `response_text` |

## CARACTERÍSTICAS TÉCNICAS

### **SEGURIDAD**
- **Row Level Security (RLS)** en todas las tablas
- **Aislamiento completo** entre organizaciones  
- **Acceso controlado** por tokens únicos
- **Funciones de seguridad** personalizadas

### **PERFORMANCE**
- **Índices optimizados** para consultas analíticas
- **Funciones SQL especializadas** para operaciones complejas
- **Vistas pre-agregadas** para dashboards
- **Estrategia de caché** en frontend

### **ESCALABILIDAD**
- **Particionamiento** preparado para alto volumen
- **Pool de conexiones** configurado
- **Limpieza automática** de datos expirados
- **Métricas de sistema** incluidas

### **FLEXIBILIDAD**
- **Configuración por proyecto** (re-evaluación, fechas límite)
- **Tipos de pregunta** extensibles (Likert, texto, múltiple opción)
- **Metadata JSON** para configuraciones personalizadas
- **Triggers automáticos** para lógica de negocio

## PATRONES DE USO CON SUPABASE

### **Autenticación Dual**
```typescript
// Para administradores: Auth tradicional de Supabase
const { user } = await supabase.auth.signInWithPassword({email, password})

// Para evaluadores: Acceso por token único
const session = await supabase.rpc('start_evaluation_session', {
  p_invitation_token: token,
  p_evaluator_name: name,
  p_evaluator_email: email
})
```

### **Operaciones Principales**
```typescript
// Crear proyecto completo
const projectId = await supabase.rpc('create_project_with_config', {
  p_organization_id: orgId,
  p_template_id: templateId,
  p_name: 'Proyecto Q4 2024'
})

// Crear equipo con invitaciones automáticas  
const teamId = await supabase.rpc('create_team_with_invitations', {
  p_project_id: projectId,
  p_team_name: 'Equipo Desarrollo',
  p_leader_name: 'Juan Pérez',
  p_leader_email: 'juan@empresa.com'
})

// Obtener análisis del proyecto
const analytics = await supabase.rpc('get_project_dashboard', {
  p_project_id: projectId
})
```

### **Consultas Optimizadas**
```typescript
// Datos del dashboard con una sola consulta
const { data } = await supabase
  .from('projects')
  .select(`
    id, name, status,
    teams:teams(count),
    evaluations:teams(evaluations(count)),
    template:question_templates(title, questions(count))
  `)
  .eq('organization_id', orgId)
```

## FLUJO DE IMPLEMENTACIÓN

### **FASE 1: FOUNDATION (2-3 semanas)**
1. **Setup Supabase** + configuración inicial
2. **Ejecutar DDL** (schema.sql)
3. **Configurar RLS** (rls_policies.sql)  
4. **Instalar funciones** (functions.sql)
5. **Testing básico** de operaciones CRUD

### **FASE 2: EVALUACIONES (3-4 semanas)**  
1. **Sistema de invitaciones** públicas
2. **Flujo de evaluación** sin autenticación
3. **Sesiones temporales** y estado persistente
4. **Validaciones** y completitud automática

### **FASE 3: ANALYTICS (2-3 semanas)**
1. **Dashboard de proyecto** con métricas
2. **Reportes por equipo** y comparaciones
3. **Exportación** de datos estructurados
4. **Visualizaciones** con librerías React

### **FASE 4: OPTIMIZACIÓN (1-2 semanas)**
1. **Performance tuning** e índices adicionales
2. **Caché inteligente** en frontend  
3. **Mantenimiento automático** y limpieza
4. **Monitoreo** y alertas de sistema

## VENTAJAS DEL DISEÑO

### **PARA DESARROLLADORES**
- 📋 **Esquema bien documentado** con ejemplos de uso
- 🔒 **Seguridad por defecto** con RLS configurado
- ⚡ **Performance optimizada** desde el inicio
- 🧩 **Modular y extensible** para futuras funcionalidades

### **PARA USUARIOS FINALES**  
- 🔗 **Enlaces simples** sin necesidad de registros
- 📱 **Funciona en cualquier dispositivo** con navegador
- 💾 **Guarda progreso automáticamente** 
- 📊 **Reportes instantáneos** y visualizaciones claras

### **PARA LA ORGANIZACIÓN**
- 🏢 **Multitenancy robusto** con aislamiento completo
- 📈 **Escalable** para miles de evaluaciones simultáneas  
- 🛡️ **Datos seguros** con políticas granulares
- 💰 **Costo-eficiente** con Supabase como BaaS

## PRÓXIMOS PASOS

1. **Revisar** el diseño completo en los archivos de la carpeta `database/`
2. **Configurar** nueva instancia de Supabase  
3. **Ejecutar** scripts SQL en orden (01, 02, 03)
4. **Implementar** hooks de React siguiendo patrones en `04_api_patterns.md`
5. **Considerar** aspectos técnicos de `05_implementation_guide.md`

---

**✨ Este diseño proporciona una base sólida, segura y escalable para implementar un sistema de evaluación de equipos de clase empresarial con Supabase y React TypeScript.**