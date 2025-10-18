// ============================================================================
// FORMULARIO DE CREACIÓN DE CUESTIONARIOS
// ============================================================================

import { useState } from 'react';
import { Box, Paper, Typography, Stepper, Step, StepLabel, Button, Alert } from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import { BasicInfoStep } from './steps/BasicInfoStep';
import { CategoriesStep } from './steps/CategoriesStep';
import { QuestionsStep } from './steps/QuestionsStep';
import { PreviewStep } from './steps/PreviewStep';
import type { QuestionnaireFormData } from './types';

const steps = ['Información Básica', 'Categorías', 'Preguntas', 'Vista Previa'];

const validationSchema = Yup.object({
  title_leader: Yup.string().required('Título para líder es obligatorio'),
  title_collaborator: Yup.string().required('Título para colaborador es obligatorio'),
  version_type: Yup.string().oneOf(['leader', 'collaborator', 'both']).required(),
  questions: Yup.array()
    .min(1, 'Debe agregar al menos una pregunta')
    .of(
      Yup.object({
        text_leader: Yup.string().required(),
        text_collaborator: Yup.string().required(),
        question_type: Yup.string().required(),
      })
    ),
});

interface QuestionnaireFormProps {
  initialData?: Partial<QuestionnaireFormData>;
  onSubmit: (data: QuestionnaireFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  mode: 'create' | 'edit';
}

export function QuestionnaireForm({ initialData, onSubmit, onCancel, mode }: QuestionnaireFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues: QuestionnaireFormData = {
    title_leader: initialData?.title_leader || '',
    title_collaborator: initialData?.title_collaborator || '',
    description_leader: initialData?.description_leader || '',
    description_collaborator: initialData?.description_collaborator || '',
    version_type: initialData?.version_type || 'both',
    is_active: initialData?.is_active ?? true,
    categories: initialData?.categories || [],
    use_categories: initialData?.use_categories ?? false,
    questions: initialData?.questions || [],
  };

  const handleNext = () => {
    setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (values: QuestionnaireFormData) => {
    try {
      setIsSubmitting(true);

      // Validar que si usa categorías, todas las preguntas tengan categoría
      if (values.use_categories && values.questions.some(q => !q.category_id)) {
        alert('Si usa categorías, todas las preguntas deben tener una categoría asignada');
        throw new Error('Todas las preguntas deben tener una categoría asignada');
      }

      const result = await onSubmit(values);

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar el cuestionario');
      }

      // Éxito - podríamos navegar o mostrar mensaje
    } catch (error) {
      console.error('Error:', error);
      // El error se maneja en el componente padre
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step: number, values: QuestionnaireFormData, setFieldValue: (field: string, value: unknown) => void) => {
    switch (step) {
      case 0:
        return <BasicInfoStep values={values} setFieldValue={setFieldValue} />;
      case 1:
        return <CategoriesStep values={values} setFieldValue={setFieldValue} />;
      case 2:
        return <QuestionsStep values={values} setFieldValue={setFieldValue} />;
      case 3:
        return <PreviewStep values={values} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 4 }}>
        {/* Header */}
        <Typography variant="h4" component="h1" gutterBottom>
          {mode === 'create' ? 'Crear Nuevo Cuestionario' : 'Editar Cuestionario'}
        </Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
          {({ values, setFieldValue, errors }) => (
            <Form>
              {/* Contenido del paso actual */}
              <Box sx={{ minHeight: 400, mb: 4 }}>{renderStepContent(activeStep, values, setFieldValue)}</Box>

              {/* Errores generales */}
              {errors.questions && typeof errors.questions === 'string' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.questions}
                </Alert>
              )}

              {/* Botones de navegación */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  {activeStep > 0 && (
                    <Button type="button" onClick={handleBack}>
                      Anterior
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {onCancel && (
                    <Button type="button" variant="outlined" onClick={onCancel}>
                      Cancelar
                    </Button>
                  )}

                  <Button
                    sx={{ display: activeStep < steps.length - 1 ? 'inline-flex' : 'none' }}
                    type="button"
                    variant="contained"
                    onClick={handleNext}
                    disabled={activeStep === 1 && values.use_categories && values.categories.length === 0}
                  >
                    Siguiente
                  </Button>
                  <Button
                    sx={{ display: activeStep === steps.length - 1 ? 'inline-flex' : 'none' }}
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting || values.questions.length === 0}
                  >
                    {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear Cuestionario' : 'Guardar Cambios'}
                  </Button>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
}
