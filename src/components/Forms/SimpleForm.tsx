// ============================================================================
// COMPONENTE FORMULARIO SIMPLE
// ============================================================================
// Formulario base reutilizable con Formik + Yup
// ============================================================================

import { Box, TextField, Button, Alert, Typography, Divider } from '@mui/material';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Esquema básico de validación
const simpleFormSchema = Yup.object({
  name: Yup.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres').required('Campo obligatorio'),

  description: Yup.string().max(500, 'Máximo 500 caracteres'),
});

// Tipos del formulario
type SimpleFormData = {
  name: string;
  description: string;
};

export interface SimpleFormProps {
  title: string;
  subtitle?: string;
  initialData?: Partial<SimpleFormData>;
  onSubmit: (data: SimpleFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitText?: string;
  cancelText?: string;
}

export function SimpleForm({
  title,
  subtitle,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
}: SimpleFormProps) {
  const initialValues: SimpleFormData = {
    name: initialData?.name || '',
    description: initialData?.description || '',
  };

  const handleSubmit = async (
    values: SimpleFormData,
    {
      setSubmitting,
      setStatus,
    }: {
      setSubmitting: (isSubmitting: boolean) => void;
      setStatus: (status: { type: string; message: string } | null) => void;
    }
  ) => {
    try {
      setStatus(null);
      const result = await onSubmit(values);

      if (!result.success) {
        setStatus({ type: 'error', message: result.error || 'Error al procesar el formulario' });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error inesperado',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik initialValues={initialValues} validationSchema={simpleFormSchema} onSubmit={handleSubmit} enableReinitialize>
      {({ errors, touched, isSubmitting, status }) => (
        <Form>
          <Box sx={{ maxWidth: 500, mx: 'auto', p: 3 }}>
            {/* Header */}
            <Typography variant="h5" component="h1" gutterBottom>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {subtitle}
              </Typography>
            )}

            <Divider sx={{ mb: 3 }} />

            {/* Alert de estado */}
            {status && (
              <Alert severity={status.type as 'error' | 'success' | 'info' | 'warning'} sx={{ mb: 3 }}>
                {status.message}
              </Alert>
            )}

            {/* Campos del formulario */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <Field
                as={TextField}
                name="name"
                label="Nombre *"
                fullWidth
                variant="outlined"
                error={touched.name && !!errors.name}
                helperText={<ErrorMessage name="name" />}
                disabled={isSubmitting || isLoading}
              />

              <Field
                as={TextField}
                name="description"
                label="Descripción"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                error={touched.description && !!errors.description}
                helperText={<ErrorMessage name="description" />}
                disabled={isSubmitting || isLoading}
              />
            </Box>

            {/* Acciones */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {onCancel && (
                <Button variant="outlined" onClick={onCancel} disabled={isSubmitting || isLoading}>
                  {cancelText}
                </Button>
              )}
              <Button type="submit" variant="contained" disabled={isSubmitting || isLoading}>
                {isSubmitting || isLoading ? 'Guardando...' : submitText}
              </Button>
            </Box>
          </Box>
        </Form>
      )}
    </Formik>
  );
}
