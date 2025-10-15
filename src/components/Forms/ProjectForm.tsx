// ============================================================================
// FORMULARIO DE PROYECTO
// ============================================================================
// Formulario para crear/editar proyectos con validación Formik + Yup
// ============================================================================

import {
  Box,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Alert,
  Grid,
  Typography,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Switch,
  Chip,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

import { useQuestionnaires } from '../../hooks/useQuestionnaires';

import type { Project } from '../../types';

// Función auxiliar para validar fechas
const isValidDate = (date: unknown): date is Date => {
  return Boolean(date && date instanceof Date && !isNaN(date.getTime()));
};

// Esquema de validación más robusto
const projectValidationSchema = Yup.object({
  name: Yup.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder los 100 caracteres')
    .required('El nombre es obligatorio'),

  description: Yup.string().max(500, 'La descripción no puede exceder los 500 caracteres'),

  status: Yup.string().oneOf(['draft', 'active', 'completed', 'archived'], 'Estado inválido').required('El estado es obligatorio'),

  start_date: Yup.date()
    .nullable()
    .test('is-valid-future-date', 'La fecha de inicio debe ser válida y no anterior a hoy', function (value) {
      if (!value) return true; // null es válido
      if (!isValidDate(value)) return this.createError({ message: 'Fecha inválida' });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value >= today;
    }),

  end_date: Yup.date()
    .nullable()
    .test('is-valid-after-start', 'La fecha de fin debe ser válida y posterior a la fecha de inicio', function (value) {
      if (!value) return true; // null es válido
      if (!isValidDate(value)) return this.createError({ message: 'Fecha inválida' });

      const { start_date } = this.parent;
      if (!start_date || !isValidDate(start_date)) return true; // Si start_date no es válida, no validamos la relación

      return value > start_date;
    }),

  budget: Yup.number().nullable().min(0, 'El presupuesto no puede ser negativo'),

  max_teams: Yup.number().nullable().min(1, 'Debe permitir al menos 1 equipo').max(100, 'No puede exceder los 100 equipos'),

  template_id: Yup.string().required('Debe seleccionar un cuestionario'),

  // Configuraciones del proyecto
  allow_re_evaluation: Yup.boolean(),

  require_evaluator_info: Yup.boolean(),

  evaluation_deadline: Yup.date()
    .nullable()
    .test('is-valid-after-start', 'La fecha límite debe ser válida y posterior a la fecha de inicio', function (value) {
      if (!value) return true; // null es válido
      if (!isValidDate(value)) return this.createError({ message: 'Fecha límite inválida' });

      const { start_date } = this.parent;
      if (!start_date || !isValidDate(start_date)) return true; // Si start_date no es válida, no validamos la relación

      return value > start_date;
    }),

  reminder_days: Yup.array()
    .of(Yup.number().min(1, 'Los días deben ser mayores a 0').max(365, 'Los días no pueden exceder 365'))
    .min(1, 'Debe configurar al menos un día de recordatorio'),

  email_notifications: Yup.boolean(),
});

// Tipos del formulario
type ProjectFormData = {
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  start_date: Date | null;
  end_date: Date | null;
  budget: number | null;
  max_teams: number | null;
  template_id: string;
  // Configuraciones
  allow_re_evaluation: boolean;
  require_evaluator_info: boolean;
  evaluation_deadline: Date | null;
  reminder_days: number[];
  email_notifications: boolean;
};

export interface ProjectFormProps {
  initialData?: Partial<Project>;
  onSubmit: (data: ProjectFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export function ProjectForm({ initialData, onSubmit, onCancel, isLoading = false, mode }: ProjectFormProps) {
  // Hook para obtener datos del usuario y templates
  const { templates, loading: templatesLoading } = useQuestionnaires();
  // Valores iniciales del formulario

  const initialValues: ProjectFormData = {
    name: initialData?.name || '',
    description: initialData?.description || '',
    status: initialData?.status || 'draft',
    start_date: initialData?.start_date ? new Date(initialData.start_date) : null,
    end_date: initialData?.end_date ? new Date(initialData.end_date) : null,
    budget: null,
    max_teams: null,
    template_id: initialData?.template_id || '',
    // Configuraciones con valores por defecto
    allow_re_evaluation: initialData?.configuration?.allow_re_evaluation || false,
    require_evaluator_info: initialData?.configuration?.require_evaluator_info ?? true,
    evaluation_deadline: initialData?.configuration?.evaluation_deadline ? new Date(initialData.configuration.evaluation_deadline) : null,
    reminder_days: initialData?.configuration?.reminder_days || [7, 3, 1],
    email_notifications: initialData?.configuration?.email_notifications ?? true,
  };
  const handleSubmit = async (
    values: ProjectFormData,
    {
      setSubmitting,
      setStatus,
    }: { setSubmitting: (isSubmitting: boolean) => void; setStatus: (status: { type: string; message: string } | null) => void }
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
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Formik initialValues={initialValues} validationSchema={projectValidationSchema} onSubmit={handleSubmit} enableReinitialize>
        {({ values, errors, touched, setFieldValue, isSubmitting, status, setStatus }) => (
          <Form>
            <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
              {/* Header */}
              <Typography variant="h5" component="h1" gutterBottom>
                {mode === 'create' ? 'Crear Nuevo Proyecto' : 'Editar Proyecto'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {mode === 'create'
                  ? 'Complete la información para crear un nuevo proyecto de evaluación'
                  : 'Modifique los campos necesarios y guarde los cambios'}
              </Typography>

              <Divider sx={{ mb: 3 }} />

              {/* Alert de estado */}
              {status && (
                <Alert severity={status.type} sx={{ mb: 3 }} onClose={() => setStatus(null)}>
                  {status.message}
                </Alert>
              )}

              <Grid container spacing={3}>
                {/* Información básica */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Información Básica
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Field
                    as={TextField}
                    name="name"
                    label="Nombre del Proyecto *"
                    fullWidth
                    variant="outlined"
                    error={touched.name && !!errors.name}
                    helperText={<ErrorMessage name="name" />}
                    disabled={isSubmitting || isLoading}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Field
                    as={TextField}
                    name="description"
                    label="Descripción"
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    error={touched.description && !!errors.description}
                    helperText={<ErrorMessage name="description" />}
                    disabled={isSubmitting || isLoading}
                  />
                </Grid>

                {/* Selección de cuestionario */}
                <Grid size={{ xs: 12 }}>
                  <FormControl
                    fullWidth
                    variant="outlined"
                    error={touched.template_id && !!errors.template_id}
                    disabled={isSubmitting || isLoading || templatesLoading}
                  >
                    <InputLabel>Cuestionario *</InputLabel>
                    <Field
                      as={Select}
                      name="template_id"
                      label="Cuestionario *"
                      value={values.template_id || ''}
                      onChange={(e: React.ChangeEvent<{ value: unknown }>) => setFieldValue('template_id', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Selecciona un cuestionario</em>
                      </MenuItem>
                      {templates.map(template => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.title}
                          {template.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                              {template.description.length > 50 ? `${template.description.substring(0, 50)}...` : template.description}
                            </Typography>
                          )}
                        </MenuItem>
                      ))}
                    </Field>
                    {templatesLoading && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          Cargando cuestionarios...
                        </Typography>
                      </Box>
                    )}
                    <FormHelperText>
                      <ErrorMessage name="template_id" />
                      {!touched.template_id && !errors.template_id && (
                        <span>Selecciona el cuestionario que se usará para las evaluaciones</span>
                      )}
                    </FormHelperText>
                  </FormControl>
                </Grid>

                {/* Estado del proyecto */}
                <Grid>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Estado del Proyecto *</FormLabel>
                    <Field
                      as={RadioGroup}
                      name="status"
                      value={values.status}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('status', e.target.value)}
                    >
                      <FormControlLabel value="draft" control={<Radio />} label="Borrador" disabled={isSubmitting || isLoading} />
                      <FormControlLabel value="active" control={<Radio />} label="Activo" disabled={isSubmitting || isLoading} />
                      <FormControlLabel value="completed" control={<Radio />} label="Completado" disabled={isSubmitting || isLoading} />
                      <FormControlLabel value="archived" control={<Radio />} label="Archivado" disabled={isSubmitting || isLoading} />
                    </Field>
                  </FormControl>
                </Grid>

                {/* Fechas */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Planificación
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label="Fecha de Inicio"
                    value={values.start_date}
                    onChange={date => setFieldValue('start_date', date)}
                    disabled={isSubmitting || isLoading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: touched.start_date && !!errors.start_date,
                        helperText: touched.start_date && errors.start_date,
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label="Fecha de Fin"
                    value={values.end_date}
                    onChange={date => setFieldValue('end_date', date)}
                    disabled={isSubmitting || isLoading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: touched.end_date && !!errors.end_date,
                        helperText: touched.end_date && errors.end_date,
                      },
                    }}
                  />
                </Grid>

                {/* Configuración adicional */}
                <Grid sx={{ display: 'none' }}>
                  <Typography variant="h6" gutterBottom>
                    Configuración
                  </Typography>
                </Grid>

                <Grid sx={{ display: 'none' }} size={{ xs: 12, md: 6 }}>
                  <Field
                    as={TextField}
                    name="budget"
                    label="Presupuesto"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={touched.budget && !!errors.budget}
                    helperText={<ErrorMessage name="budget" />}
                    disabled={isSubmitting || isLoading}
                    InputProps={{
                      startAdornment: (
                        <Box component="span" sx={{ mr: 1 }}>
                          $
                        </Box>
                      ),
                    }}
                  />
                </Grid>

                <Grid sx={{ display: 'none' }} size={{ xs: 12, md: 6 }}>
                  <Field
                    as={TextField}
                    name="max_teams"
                    label="Máximo de Equipos"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={touched.max_teams && !!errors.max_teams}
                    helperText={<ErrorMessage name="max_teams" />}
                    disabled={isSubmitting || isLoading}
                  />
                </Grid>

                {/* Configuraciones Avanzadas */}
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Configuraciones de Evaluación
                  </Typography>
                </Grid>

                {/* Re-evaluaciones */}
                <Grid>
                  <FormControl component="fieldset">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.allow_re_evaluation}
                          onChange={e => setFieldValue('allow_re_evaluation', e.target.checked)}
                          disabled={isSubmitting || isLoading}
                        />
                      }
                      label="Permitir re-evaluaciones"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      Los participantes podrán modificar sus respuestas después de enviarlas
                    </Typography>
                  </FormControl>
                </Grid>

                {/* Información del evaluador */}
                <Grid>
                  <FormControl component="fieldset">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.require_evaluator_info}
                          onChange={e => setFieldValue('require_evaluator_info', e.target.checked)}
                          disabled={isSubmitting || isLoading}
                        />
                      }
                      label="Requerir información del participante"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      Solicitar nombre y email antes de comenzar la evaluación
                    </Typography>
                  </FormControl>
                </Grid>

                {/* Fecha límite de evaluaciones */}
                <Grid>
                  <DatePicker
                    label="Fecha límite de evaluaciones"
                    value={values.evaluation_deadline}
                    onChange={date => setFieldValue('evaluation_deadline', date)}
                    disabled={isSubmitting || isLoading}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: touched.evaluation_deadline && !!errors.evaluation_deadline,
                        helperText:
                          touched.evaluation_deadline && errors.evaluation_deadline
                            ? errors.evaluation_deadline
                            : 'Fecha después de la cual no se pueden realizar evaluaciones',
                      },
                    }}
                  />
                </Grid>

                {/* Notificaciones por email */}
                <Grid sx={{ display: 'none' }}>
                  <FormControl component="fieldset">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.email_notifications}
                          onChange={e => setFieldValue('email_notifications', e.target.checked)}
                          disabled={isSubmitting || isLoading}
                        />
                      }
                      label="Activar notificaciones por email"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      Enviar recordatorios automáticos a los evaluadores
                    </Typography>
                  </FormControl>
                </Grid>

                {/* Días de recordatorio */}
                <Grid sx={{ display: 'none' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Días de recordatorio antes de la fecha límite
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {values.reminder_days.map((day, index) => (
                      <Chip
                        key={index}
                        label={`${day} días`}
                        onDelete={() => {
                          const newReminderDays = values.reminder_days.filter((_, i) => i !== index);
                          setFieldValue('reminder_days', newReminderDays);
                        }}
                        deleteIcon={<DeleteIcon />}
                        color="primary"
                        variant="outlined"
                        disabled={isSubmitting || isLoading}
                      />
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      type="number"
                      label="Días"
                      size="small"
                      inputProps={{ min: 1, max: 365 }}
                      disabled={isSubmitting || isLoading}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const day = parseInt(input.value);
                          if (day && day > 0 && day <= 365 && !values.reminder_days.includes(day)) {
                            setFieldValue(
                              'reminder_days',
                              [...values.reminder_days, day].sort((a, b) => b - a)
                            );
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <IconButton
                      onClick={e => {
                        const input = (e.currentTarget.previousElementSibling as HTMLInputElement)?.querySelector('input');
                        if (input) {
                          const day = parseInt(input.value);
                          if (day && day > 0 && day <= 365 && !values.reminder_days.includes(day)) {
                            setFieldValue(
                              'reminder_days',
                              [...values.reminder_days, day].sort((a, b) => b - a)
                            );
                            input.value = '';
                          }
                        }
                      }}
                      disabled={isSubmitting || isLoading}
                      color="primary"
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Presiona Enter o haz clic en + para agregar días
                  </Typography>
                  {touched.reminder_days && errors.reminder_days && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                      {errors.reminder_days}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              {/* Acciones */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                {onCancel && (
                  <Button variant="outlined" onClick={onCancel} disabled={isSubmitting || isLoading}>
                    Cancelar
                  </Button>
                )}
                <Button type="submit" variant="contained" disabled={isSubmitting || isLoading}>
                  {isSubmitting || isLoading ? 'Guardando...' : mode === 'create' ? 'Crear Proyecto' : 'Guardar Cambios'}
                </Button>
              </Box>
            </Box>
          </Form>
        )}
      </Formik>
    </LocalizationProvider>
  );
}
