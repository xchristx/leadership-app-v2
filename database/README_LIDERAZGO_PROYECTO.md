# Evaluación de Liderazgo de Proyecto

## 📋 Descripción

Esta funcionalidad permite evaluar al **líder del proyecto** usando el mismo sistema de evaluación que se usa para los equipos. Los evaluadores son los **líderes de cada equipo** del proyecto.

## 🏗️ Arquitectura

### Concepto
- Se crea un **"equipo especial"** con `team_type = 'project_leadership'`
- Este equipo funciona igual que un equipo regular pero tiene un propósito especial
- Genera **solo 2 invitaciones**:
  1. Una para el líder del proyecto (autoevaluación)
  2. Una para todos los líderes de equipo (enlace compartido)

### Ventajas
- ✅ Reutiliza 100% el código existente
- ✅ Mismo dashboard (TeamDashboard)
- ✅ Mismo sistema de invitaciones
- ✅ Mismo cuestionario del proyecto
- ✅ Mínimos cambios en la base de datos

## 🗄️ Cambios en Base de Datos

### Migración: `07_add_team_type.sql`

```sql
-- Agregar columna team_type
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS team_type VARCHAR(50) DEFAULT 'regular' 
  CHECK (team_type IN ('regular', 'project_leadership'));

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_teams_team_type ON teams(team_type);
CREATE INDEX IF NOT EXISTS idx_teams_project_type ON teams(project_id, team_type);
```

### Valores Permitidos
- `'regular'` - Equipo normal del proyecto
- `'project_leadership'` - Equipo especial para evaluar liderazgo de proyecto

## 🔧 Componentes Nuevos

### 1. Servicio: `projectLeadershipService.ts`

Funciones principales:
- `createProjectLeadershipTeam()` - Crea el equipo especial con 2 invitaciones
- `checkProjectLeadershipTeam()` - Verifica si ya existe
- `getProjectLeadershipTeam()` - Obtiene el equipo de liderazgo
- `getProjectLeadershipInvitations()` - Obtiene las invitaciones

### 2. Componente: `CreateProjectLeadershipDialog.tsx`

Modal para configurar la evaluación de liderazgo:
- Muestra información del proyecto
- Explica las 2 invitaciones que se generarán
- No pide datos de evaluadores (se completan al acceder al enlace)

### 3. Actualización: `ProjectDetailPageSimple.tsx`

Cambios realizados:
- Botón **"Configurar Liderazgo"** (solo si no existe)
- Tarjeta especial con gradiente para el equipo de liderazgo
- Separación visual entre equipo de liderazgo y equipos regulares
- Filtrado de equipos por `team_type`

## 📊 Flujo de Usuario

### 1. Configurar Evaluación

```
ProjectDetailPage
  └─> Botón "Configurar Liderazgo"
       └─> Modal CreateProjectLeadershipDialog
            └─> Crea equipo + 2 invitaciones
```

### 2. Estructura Creada

```
Equipo: "Evaluación de Liderazgo - {Proyecto}"
├── team_type: 'project_leadership'
├── team_size: 2
└── Invitaciones:
    ├── [Token-ABC] role: 'leader' (líder del proyecto)
    └── [Token-XYZ] role: 'collaborator' (todos los líderes de equipo)
```

### 3. Acceso a las Invitaciones

#### Líder del Proyecto
1. Accede al enlace con Token-ABC
2. Ingresa su nombre y email
3. Completa la autoevaluación

#### Líderes de Equipo
1. Todos acceden al mismo enlace (Token-XYZ)
2. Cada uno ingresa su nombre y email
3. Cada uno completa la evaluación del líder del proyecto
4. El sistema registra múltiples evaluaciones con el mismo token

### 4. Ver Resultados

```
ProjectDetailPage
  └─> Tarjeta de Liderazgo del Proyecto
       └─> Botón "Ver Dashboard"
            └─> TeamDashboard (mismo que equipos regulares)
                 ├── Gráficos comparativos
                 ├── Análisis por categoría
                 └── Exportación a PDF/Word
```

## 🎨 Interfaz Visual

### Tarjeta Especial de Liderazgo

```tsx
// Fondo con gradiente morado
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

// Icono de estrella
<StarIcon /> en Avatar blanco

// Información mostrada:
- Título: "📊 Evaluación de Liderazgo del Proyecto"
- Descripción: "Líder del proyecto + Líderes de equipo como evaluadores"
- Fecha de creación
- Botón "Ver Dashboard"
```

### Botón de Configuración

```tsx
// Solo aparece si NO existe equipo de liderazgo
<Button
  variant="outlined"
  startIcon={<StarIcon />}
  color="secondary"
>
  Configurar Liderazgo
</Button>
```

## 🔑 Características Clave

### Sistema de Invitaciones Simplificado

**Antes (equipos regulares):**
- 1 invitación para líder
- N invitaciones para colaboradores (una por persona)

**Ahora (liderazgo de proyecto):**
- 1 invitación para líder del proyecto
- 1 invitación compartida para todos los líderes de equipo

### Ventajas del Enlace Compartido

1. **Simplicidad**: Un solo enlace para distribuir
2. **Flexibilidad**: No importa cuántos líderes de equipo haya
3. **Escalabilidad**: Funciona si se agregan más equipos después
4. **Facilidad**: Más fácil de gestionar y compartir

## 📝 Tipos TypeScript Actualizados

### Team

```typescript
export interface Team {
  id: string
  project_id: string
  name: string
  team_type?: 'regular' | 'project_leadership' // ← NUEVO
  leader_name?: string
  leader_email?: string
  team_size?: number
  is_active: boolean
  // ... otros campos
}
```

### CreateTeamData

```typescript
export interface CreateTeamData {
  project_id: string
  name: string
  team_type?: 'regular' | 'project_leadership' // ← NUEVO
  leader_name?: string
  leader_email?: string
  team_size?: number
  is_active?: boolean
}
```

## 🚀 Cómo Usar

### 1. Ejecutar la Migración

```bash
# Conectarse a Supabase y ejecutar:
psql -h [HOST] -U [USER] -d [DATABASE] -f database/07_add_team_type.sql
```

### 2. Crear Evaluación de Liderazgo

1. Ir a la página de detalles del proyecto
2. Click en **"Configurar Liderazgo"**
3. Confirmar en el modal
4. Se crea automáticamente el equipo + invitaciones

### 3. Compartir Invitaciones

1. Click en la tarjeta de liderazgo → **"Ver Dashboard"**
2. Copiar enlace de **"Invitación Líder"** → Enviar al líder del proyecto
3. Copiar enlace de **"Invitación Colaboradores"** → Enviar a todos los líderes de equipo

### 4. Ver Resultados

1. Los evaluadores completan sus evaluaciones
2. El dashboard muestra resultados en tiempo real
3. Comparación automática entre autoevaluación y percepción de líderes
4. Exportación a PDF/Word disponible

## ⚠️ Consideraciones

### Limitaciones

- Solo puede haber **un equipo de liderazgo por proyecto**
- No se puede editar después de creado (igual que equipos regulares)
- Eliminar el equipo de liderazgo elimina todas las evaluaciones

### Recomendaciones

1. Configurar el liderazgo **después** de crear los equipos regulares
2. Asegurarse de que los líderes de equipo ya hayan sido asignados
3. Comunicar claramente a los líderes de equipo que evaluarán al líder del proyecto

## 🔮 Futuras Mejoras Posibles

1. **Notificaciones automáticas** cuando se crea la evaluación
2. **Dashboard agregado** que compare liderazgo de proyecto con equipos
3. **Jerarquías múltiples** (directores, VPs, etc.)
4. **Evaluaciones 360°** completas
5. **Reportes consolidados** de toda la organización

## 📚 Archivos Modificados/Creados

### Base de Datos
- ✅ `database/07_add_team_type.sql` (nuevo)

### Servicios
- ✅ `src/services/projectLeadershipService.ts` (nuevo)

### Componentes
- ✅ `src/components/Teams/CreateProjectLeadershipDialog.tsx` (nuevo)
- ✅ `src/pages/ProjectDetailPageSimple.tsx` (modificado)

### Tipos
- ✅ `src/types/index.ts` (modificado)
  - Team interface
  - CreateTeamData interface
  - UpdateTeamData interface

## 🎯 Resultado Final

Con esta implementación, ahora es posible:

✅ Evaluar al líder del proyecto
✅ Los líderes de equipo son los evaluadores
✅ El líder del proyecto puede autoevaluarse
✅ Usa el mismo template de preguntas del proyecto
✅ Genera reportes y análisis completos
✅ Exporta resultados a PDF/Word
✅ Interfaz visual clara y distintiva
✅ Mínimos cambios en el código existente
