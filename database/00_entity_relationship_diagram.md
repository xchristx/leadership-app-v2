# DIAGRAMA ENTIDAD-RELACIÓN
## Sistema de Evaluación de Equipos de Trabajo

### ENTIDADES PRINCIPALES Y RELACIONES

```
ORGANIZATIONS (1) ───── (N) USERS
    │
    │ (1:N)
    ▼
QUESTION_TEMPLATES ───── (1:N) ───── QUESTIONS
    │                                   │
    │ (1:N)                            │ (1:N)  
    ▼                                   ▼
PROJECTS ───── (1:N) ───── TEAMS ───── (1:N) ───── EVALUATIONS
    │                         │                        │
    │ (1:N)                   │ (1:N)                 │ (1:N)
    ▼                         ▼                        ▼
PROJECT_CONFIGURATIONS    TEAM_INVITATIONS ──── EVALUATION_RESPONSES
                             │ (1:1)               │
                             ▼                    │ (N:1)
                          INVITATION_SESSIONS ────┘
```

### DESCRIPCIÓN DE ENTIDADES

#### 1. **ORGANIZATIONS** (Empresas/Organizaciones)
- **PK**: `id` (UUID)
- **Campos**: `name`, `subdomain`, `settings`
- **Propósito**: Multitenancy - aislamiento de datos por empresa
- **Relaciones**: 1:N con Users, Question_Templates, Projects

#### 2. **USERS** (Usuarios Administradores)
- **PK**: `id` (UUID) 
- **Campos**: `email`, `role`, `organization_id`
- **Propósito**: Gestión de acceso administrativo
- **Relaciones**: N:1 con Organizations

#### 3. **QUESTION_TEMPLATES** (Plantillas de Cuestionarios)
- **PK**: `id` (UUID)
- **Campos**: `title`, `description`, `version_type`, `organization_id`
- **Propósito**: Reutilización de cuestionarios entre proyectos
- **Relaciones**: 
  - N:1 con Organizations
  - 1:N con Questions
  - 1:N con Projects

#### 4. **QUESTIONS** (Preguntas del Cuestionario)
- **PK**: `id` (UUID)
- **Campos**: `text_leader`, `text_collaborator`, `category`, `order_index`
- **Propósito**: Preguntas adaptables según rol (líder vs colaborador)
- **Relaciones**: 
  - N:1 con Question_Templates
  - 1:N con Evaluation_Responses

#### 5. **PROJECTS** (Proyectos de Evaluación)
- **PK**: `id` (UUID)
- **Campos**: `name`, `description`, `hierarchy_levels`, `status`
- **Propósito**: Contenedor independiente para evaluaciones
- **Relaciones**:
  - N:1 con Organizations
  - N:1 con Question_Templates
  - 1:N con Teams
  - 1:1 con Project_Configurations

#### 6. **PROJECT_CONFIGURATIONS** (Configuración de Proyecto)
- **PK**: `id` (UUID)
- **Campos**: `allow_re_evaluation`, `evaluation_deadline`, `custom_settings`
- **Propósito**: Configuraciones específicas por proyecto
- **Relaciones**: 1:1 con Projects

#### 7. **TEAMS** (Equipos de Trabajo)
- **PK**: `id` (UUID)
- **Campos**: `name`, `leader_name`, `leader_email`, `project_id`
- **Propósito**: Unidad de evaluación - cada equipo tiene su conjunto de evaluaciones
- **Relaciones**:
  - N:1 con Projects
  - 1:N con Team_Invitations
  - 1:N con Evaluations

#### 8. **TEAM_INVITATIONS** (Invitaciones por Rol)
- **PK**: `id` (UUID)
- **Campos**: `team_id`, `role_type`, `unique_token`, `expires_at`
- **Propósito**: Links únicos sin autenticación compleja
- **Relaciones**:
  - N:1 con Teams
  - 1:1 con Invitation_Sessions
  - 1:N con Evaluations

#### 9. **INVITATION_SESSIONS** (Sesiones Temporales)
- **PK**: `id` (UUID)
- **Campos**: `invitation_id`, `session_data`, `last_activity`
- **Propósito**: Manejo de estado para usuarios no autenticados
- **Relaciones**: 1:1 con Team_Invitations

#### 10. **EVALUATIONS** (Evaluaciones Completadas)
- **PK**: `id` (UUID)
- **Campos**: `evaluator_name`, `evaluator_email`, `completed_at`, `team_id`
- **Propósito**: Registro de evaluación completada
- **Relaciones**:
  - N:1 con Teams
  - N:1 con Team_Invitations
  - 1:N con Evaluation_Responses

#### 11. **EVALUATION_RESPONSES** (Respuestas Individuales)
- **PK**: `id` (UUID)
- **Campos**: `evaluation_id`, `question_id`, `response_value`, `response_text`
- **Propósito**: Almacenamiento de respuestas con metadatos para análisis
- **Relaciones**:
  - N:1 con Evaluations
  - N:1 con Questions

### CARDINALIDADES DETALLADAS

```
ORGANIZATIONS (1) ──── (N) USERS
ORGANIZATIONS (1) ──── (N) QUESTION_TEMPLATES  
ORGANIZATIONS (1) ──── (N) PROJECTS

QUESTION_TEMPLATES (1) ──── (N) QUESTIONS
QUESTION_TEMPLATES (1) ──── (N) PROJECTS

PROJECTS (1) ──── (N) TEAMS
PROJECTS (1) ──── (1) PROJECT_CONFIGURATIONS

TEAMS (1) ──── (N) TEAM_INVITATIONS
TEAMS (1) ──── (N) EVALUATIONS

TEAM_INVITATIONS (1) ──── (1) INVITATION_SESSIONS
TEAM_INVITATIONS (1) ──── (N) EVALUATIONS

EVALUATIONS (1) ──── (N) EVALUATION_RESPONSES
QUESTIONS (1) ──── (N) EVALUATION_RESPONSES
```

### FLUJO DE DATOS PRINCIPAL

1. **Configuración**: Organización → Plantilla → Preguntas
2. **Proyecto**: Plantilla → Proyecto → Configuración → Equipos  
3. **Invitación**: Equipo → Invitaciones por Rol → Sesiones
4. **Evaluación**: Sesión → Evaluación → Respuestas
5. **Análisis**: Respuestas → Agregaciones por Equipo/Proyecto/Categoría