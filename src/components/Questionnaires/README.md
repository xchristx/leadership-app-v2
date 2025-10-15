# Módulo de Cuestionarios - Leadership App

## Descripción General

El módulo de cuestionarios permite crear formularios personalizados para evaluar liderazgo con soporte para versiones duales (líderes y colaboradores), sistema de categorías opcional, y múltiples tipos de preguntas con énfasis en escalas Likert.

## Características Principales

- ✅ **Versiones Duales**: Soporte para líderes y colaboradores con títulos/descripciones separadas
- ✅ **Sistema de Categorías**: Organización opcional de preguntas por categorías
- ✅ **Tipos de Preguntas**: Text, Multiple Choice, Likert Scale (1-10)
- ✅ **Interfaz Paso a Paso**: Wizard con 4 pasos usando Material-UI Stepper
- ✅ **Validación Completa**: Formik + Yup para validación de formularios
- ✅ **Vista Previa**: Preview completo antes de crear el cuestionario
- ✅ **TypeScript**: Tipado completo para mayor seguridad

## Estructura del Módulo

```
src/components/Questionnaires/
├── index.ts                    # Exportaciones públicas
├── types.ts                   # Definiciones de tipos
├── QuestionnaireForm.tsx      # Componente principal
└── steps/
    ├── BasicInfoStep.tsx      # Paso 1: Información básica
    ├── CategoriesStep.tsx     # Paso 2: Gestión de categorías
    ├── QuestionsStep.tsx      # Paso 3: Gestión de preguntas
    └── PreviewStep.tsx        # Paso 4: Vista previa
```

## Uso Básico

### 1. Importar el Componente

\`\`\`tsx
import { QuestionnaireForm } from '../components/Questionnaires';
import type { QuestionnaireFormData } from '../components/Questionnaires';
\`\`\`

### 2. Implementar Handler de Envío

\`\`\`tsx
const handleSubmit = async (formData: QuestionnaireFormData): Promise<{ success: boolean; error?: string }> => {
  try {
    // Enviar datos a tu backend/API
    const response = await api.createQuestionnaire(formData);
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
};
\`\`\`

### 3. Usar el Componente

\`\`\`tsx
<QuestionnaireForm
  mode="create"
  onSubmit={handleSubmit}
  onCancel={() => setShowForm(false)}
/>
\`\`\`

## Estructura de Datos

### QuestionnaireFormData

\`\`\`typescript
interface QuestionnaireFormData {
  // Información básica
  title_leader: string;
  title_collaborator: string;
  description_leader?: string;
  description_collaborator?: string;
  
  // Configuración
  version_type: 'leader' | 'collaborator' | 'both';
  is_active: boolean;
  
  // Categorías (opcional)
  use_categories: boolean;
  categories: QuestionCategory[];
  
  // Preguntas
  questions: QuestionFormData[];
}
\`\`\`

### QuestionFormData

\`\`\`typescript
interface QuestionFormData {
  id: string;
  text_leader: string;
  text_collaborator: string;
  question_type: 'text' | 'multiple_choice' | 'likert';
  category_id?: string;
  response_config: {
    // Para likert
    scale?: number;          // 1-10
    min_label?: string;      // "Muy en desacuerdo"
    max_label?: string;      // "Muy de acuerdo"
    
    // Para multiple choice
    options?: string[];      // ["Opción 1", "Opción 2", ...]
  };
  order_index: number;
}
\`\`\`

## Pasos del Formulario

### Paso 1: Información Básica
- Selección de tipo de versión (líderes, colaboradores, o ambos)
- Títulos y descripciones para cada versión
- Estado activo/inactivo

### Paso 2: Categorías (Opcional)
- Activar/desactivar uso de categorías
- CRUD completo de categorías
- Reordenamiento preparado para drag & drop futuro

### Paso 3: Preguntas
- CRUD completo de preguntas
- Configuración específica por tipo de pregunta
- Asignación de categorías (si está activado)
- Vista previa dual de textos

### Paso 4: Vista Previa
- Resumen del cuestionario
- Vista previa completa para cada audiencia
- Validaciones finales antes del envío

## Tipos de Preguntas Soportados

### 1. Texto Libre (\`text\`)
- Campo de texto multilínea para respuestas abiertas

### 2. Opción Múltiple (\`multiple_choice\`)
- Lista de opciones predefinidas
- Selección única tipo radio button

### 3. Escala Likert (\`likert\`)
- Escala configurable de 1 a 10
- Etiquetas personalizables para mínimo y máximo
- Ideal para evaluaciones de liderazgo

## Validaciones

El formulario incluye validaciones completas:

- **Información básica**: Títulos requeridos según tipo de versión
- **Categorías**: Al menos una categoría si está activado el uso
- **Preguntas**: 
  - Al menos una pregunta requerida
  - Textos para ambas versiones requeridos
  - Configuración específica según tipo de pregunta
  - Asignación de categoría si está activado

## Integración con Backend

Para integrar con Supabase u otro backend, implementa la lógica en el handler \`onSubmit\`:

\`\`\`tsx
const handleSubmit = async (formData: QuestionnaireFormData) => {
  // 1. Crear el cuestionario principal
  const questionnaire = await supabase
    .from('questionnaires')
    .insert({
      title_leader: formData.title_leader,
      title_collaborator: formData.title_collaborator,
      // ... otros campos
    });

  // 2. Crear categorías si se usan
  if (formData.use_categories) {
    await supabase
      .from('question_categories')
      .insert(formData.categories.map(cat => ({
        questionnaire_id: questionnaire.data.id,
        ...cat
      })));
  }

  // 3. Crear preguntas
  await supabase
    .from('questions')
    .insert(formData.questions.map(q => ({
      questionnaire_id: questionnaire.data.id,
      ...q
    })));

  return { success: true };
};
\`\`\`

## Ejemplo Completo

Ver \`src/pages/QuestionnairesPage.tsx\` para un ejemplo completo de implementación con:
- Manejo de estado del formulario
- Procesamiento de envío
- Manejo de errores
- Interfaz de usuario completa

## Personalización

El módulo está diseñado para ser extensible:

- **Nuevos tipos de pregunta**: Añadir en \`types.ts\` y \`QuestionsStep.tsx\`
- **Campos adicionales**: Extender las interfaces de tipos
- **Validaciones custom**: Modificar esquemas de Yup
- **Estilos**: Personalizar temas de Material-UI

## Próximas Mejoras

- 🔄 Drag & drop para reordenar categorías y preguntas
- 📊 Plantillas de cuestionarios predefinidas
- 🎨 Editor visual de escalas Likert
- 📱 Vista responsive mejorada
- 🔍 Búsqueda y filtros en gestión de preguntas