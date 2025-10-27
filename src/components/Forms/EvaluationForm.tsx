// ============================================================================
// FORMULARIO DE EVALUACIÓN
// ============================================================================
// Formulario para crear/editar evaluaciones con validación Formik + Yup
// ============================================================================

import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Grid,
} from '@mui/material';
import type { Evaluation, Team } from '../../types';

// Validaciones del formulario
const validationSchema = Yup.object().shape({
  evaluator_name: Yup.string().required('El nombre es requerido').min(2, 'El nombre debe tener al menos 2 caracteres'),

  evaluator_email: Yup.string().required('El email es requerido').email('Debe ser un email válido'),

  team_id: Yup.string().required('Debe seleccionar un equipo'),

  evaluator_role: Yup.string().required('El rol es requerido').oneOf(['leader', 'collaborator'], 'Rol inválido'),
});

// Tipos del formulario
type EvaluationFormData = {
  evaluator_name: string;
  evaluator_email: string;
  team_id: string;
  evaluator_role: 'leader' | 'collaborator' | 'supervisor';
  evaluator_metadata?: Record<string, unknown>;
};

export interface EvaluationFormProps {
  initialData?: Partial<Evaluation>;
  availableTeams?: Team[];
  onSubmit: (data: EvaluationFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export function EvaluationForm({ initialData, availableTeams = [], onSubmit, onCancel, isLoading = false, mode }: EvaluationFormProps) {
  // Valores iniciales del formulario
  const initialValues: EvaluationFormData = {
    evaluator_name: initialData?.evaluator_name || '',
    evaluator_email: initialData?.evaluator_email || '',
    team_id: initialData?.team_id || '',
    evaluator_role: (initialData?.evaluator_role as 'leader' | 'collaborator') || 'collaborator',
    evaluator_metadata: initialData?.evaluator_metadata || {},
  };

  const handleSubmit = async (
    values: EvaluationFormData,
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
        setStatus({ type: 'error', message: result.error || 'Error al procesar la evaluación' });
        return;
      }

      setStatus({ type: 'success', message: 'Evaluación procesada exitosamente' });
    } catch (error) {
      console.error('Error en el formulario:', error);
      setStatus({ type: 'error', message: 'Error interno del servidor' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <Typography variant="h6" component="h2">
            {mode === 'create' ? 'Nueva Evaluación' : 'Editar Evaluación'}
          </Typography>
        }
      />
      <CardContent>
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
          {({ values, errors, touched, setFieldValue, isSubmitting, status }) => (
            <Form>
              {/* Mensaje de estado */}
              {status && (
                <Alert severity={status.type as 'error' | 'success' | 'info' | 'warning'} sx={{ mb: 3 }}>
                  {status.message}
                </Alert>
              )}

              <Grid container spacing={3}>
                {/* Nombre del evaluador */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    name="evaluator_name"
                    label="Nombre del Evaluador"
                    value={values.evaluator_name}
                    onChange={e => setFieldValue('evaluator_name', e.target.value)}
                    error={touched.evaluator_name && !!errors.evaluator_name}
                    helperText={touched.evaluator_name && errors.evaluator_name}
                    required
                  />
                </Grid>

                {/* Email del evaluador */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    type="email"
                    name="evaluator_email"
                    label="Email del Evaluador"
                    value={values.evaluator_email}
                    onChange={e => setFieldValue('evaluator_email', e.target.value)}
                    error={touched.evaluator_email && !!errors.evaluator_email}
                    helperText={touched.evaluator_email && errors.evaluator_email}
                    required
                  />
                </Grid>

                {/* Selección de equipo */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    select
                    name="team_id"
                    label="Equipo"
                    value={values.team_id}
                    onChange={e => setFieldValue('team_id', e.target.value)}
                    error={touched.team_id && !!errors.team_id}
                    helperText={touched.team_id && errors.team_id}
                    required
                  >
                    {availableTeams.map(team => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name} - {team.leader_name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Rol del evaluador */}
                <Grid size={{ xs: 12 }}>
                  <FormControl component="fieldset" error={touched.evaluator_role && !!errors.evaluator_role}>
                    <FormLabel component="legend">Rol del Evaluador</FormLabel>
                    <RadioGroup value={values.evaluator_role} onChange={e => setFieldValue('evaluator_role', e.target.value)}>
                      <FormControlLabel value="leader" control={<Radio />} label="Líder" />
                      <FormControlLabel value="collaborator" control={<Radio />} label="Colaborador" />
                    </RadioGroup>
                    {touched.evaluator_role && errors.evaluator_role && (
                      <Typography variant="caption" color="error">
                        {errors.evaluator_role}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                {/* Botones de acción */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    {onCancel && (
                      <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                      </Button>
                    )}
                    <Button type="submit" variant="contained" disabled={isSubmitting || isLoading}>
                      {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear Evaluación' : 'Actualizar Evaluación'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
}
