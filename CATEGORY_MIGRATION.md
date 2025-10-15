# Migración de Categorías a JSON

## 📋 Resumen
Se ha actualizado la estructura de la tabla `questions` para cambiar la columna `category` de tipo `string` a tipo `JSON`. Este cambio permite almacenar información completa de las categorías incluyendo nombre, descripción y color.

## 🎯 Objetivos
- ✅ Almacenar información completa de categorías (nombre, descripción, color)
- ✅ Mantener compatibilidad hacia atrás con categorías existentes
- ✅ Mejorar la experiencia de usuario con categorías más ricas
- ✅ Facilitar futuras extensiones de funcionalidad

## 🔄 Cambios Realizados

### 1. Base de Datos
- **Antes**: `category: string | null`
- **Después**: `category: JSON | null`

**Estructura JSON:**
```json
{
  "id": "categoria-1",
  "name": "Liderazgo Estratégico", 
  "description": "Preguntas sobre visión y planificación estratégica",
  "color": "#1976d2"
}
```

### 2. Tipos TypeScript (`database.types.ts`)
```typescript
// Antes
category: string | null

// Después  
category: Json | null
```

### 3. Servicio (`questionnaireService.ts`)

#### Creación de Cuestionarios
```typescript
// Ahora se guardan objetos JSON completos
const categoryDataMap: Record<string, CategoryData> = {};
formData.categories.forEach((category) => {
  categoryDataMap[category.id] = {
    id: category.id,
    name: category.name,
    description: category.description || '',
    color: '#1976d2'
  };
});
```

#### Carga de Cuestionarios
```typescript
// Extrae categorías de objetos JSON
const uniqueCategories = new Map<string, CategoryData>();
questionsResult.data?.forEach(question => {
  if (question.category) {
    const categoryData = question.category as unknown as CategoryData;
    if (categoryData?.id) {
      uniqueCategories.set(categoryData.id, categoryData);
    }
  }
});
```

### 4. Componentes de UI

#### QuestionnaireViewer
```typescript
// Manejo de categorías híbrido (string legacy + JSON nuevo)
const categoryLabel = typeof question.category === 'string' 
  ? question.category 
  : (question.category as CategoryData)?.name || 'Categoría';
```

#### QuestionnaireEditor
```typescript
// Conversión bidireccional entre JSON y formulario
const convertToFormData = (template, questions) => {
  // Extrae categorías de JSON y las convierte al formato del formulario
  questions.forEach(question => {
    if (question.category) {
      if (typeof question.category === 'string') {
        // Categoría legacy
      } else {
        // Categoría JSON nueva
        const catObj = question.category as CategoryData;
      }
    }
  });
};
```

## 📊 Migración de Datos

### Proceso
1. **Respaldo**: Se crean copias de seguridad de datos existentes
2. **Conversión**: Strings existentes se convierten a objetos JSON
3. **Validación**: Se verifica la integridad de datos migrados
4. **Indexación**: Se crean índices para optimizar consultas

### Compatibilidad
- ✅ **Hacia atrás**: El código maneja tanto strings legacy como JSON nuevo
- ✅ **Hacia adelante**: Nuevas categorías se crean como JSON completo
- ✅ **Gradual**: La migración no interrumpe funcionalidad existente

## 🚀 Beneficios

### Para Usuarios
- 🎨 **Categorías visuales**: Colores personalizados para cada categoría
- 📝 **Descripciones**: Información adicional sobre el propósito de cada categoría
- 🏷️ **Nombres descriptivos**: Categorías más expresivas y claras

### Para Desarrolladores
- 🔧 **Estructura rica**: Más información disponible en cada categoría
- 🔄 **Extensibilidad**: Fácil agregar nuevos campos a categorías
- 📊 **Consultas avanzadas**: Filtrado y agrupación por propiedades de categoría

## 📋 Pasos de Implementación

### 1. Base de Datos
```sql
-- Ejecutar migrate_categories_to_json.sql
psql -d leadership_app -f migrate_categories_to_json.sql
```

### 2. Código
- ✅ Tipos actualizados en `database.types.ts`
- ✅ Servicio actualizado en `questionnaireService.ts`  
- ✅ Componentes actualizados para manejar JSON
- ✅ Hook `useQuestionnaires` simplificado

### 3. Testing
```bash
# Compilar para verificar tipos
pnpm build

# Ejecutar tests (cuando estén disponibles)
pnpm test
```

## ⚠️ Consideraciones

### Performance
- Se agregó índice GIN para consultas JSON eficientes
- Consultas por nombre de categoría optimizadas

### Rollback
- Respaldo automático en `questions_backup`
- Proceso reversible mediante scripts SQL

### Monitoreo
- Logs detallados durante migración
- Verificaciones de integridad incluidas

## 🎉 Resultado Final

Ahora las categorías son objetos ricos que permiten:
- Interfaces más atractivas con colores
- Mejor organización visual
- Información contextual adicional
- Base sólida para futuras mejoras

La migración mantiene total compatibilidad mientras habilita nuevas capacidades! 🚀