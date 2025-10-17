// ============================================================================
// FORMULARIO DE EQUIPO
// ============================================================================
// Formulario para crear/editar equipos con validación Formik + Yup
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
  FormControlLabel,
  Switch,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';

import { useProjects } from '../../hooks/useProjects';
import type { Team } from '../../types';

// Validaciones del formulario
const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required('El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  project_id: Yup.string().required('Debe seleccionar un proyecto'),

  leader_name: Yup.string()
    .optional()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .nullable(),

  leader_email: Yup.string().optional().email('Debe ser un email válido').max(100, 'El email no puede exceder 100 caracteres').nullable(),

  team_size: Yup.number()
    .required('El tamaño del equipo es requerido')
    .min(2, 'Un equipo debe tener al menos 2 miembros')
    .max(50, 'Un equipo no puede exceder 50 miembros')
    .integer('Debe ser un número entero'),
});

// Tipos del formulario
export type TeamFormData = {
  name: string;
  project_id: string;
  leader_name?: string | null;
  leader_email?: string | null;
  team_size: number;
  is_active: boolean;
};

export interface TeamFormProps {
  initialData?: Partial<Team>;
  onSubmit: (data: TeamFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

export function TeamForm({ initialData, onSubmit, onCancel, isLoading = false, mode }: TeamFormProps) {
  // Hook para obtener proyectos disponibles
  const { projects, isLoading: projectsLoading } = useProjects();

  // Valores iniciales del formulario
  const initialValues: TeamFormData = {
    name: initialData?.name || '',
    project_id: initialData?.project_id || '',
    leader_name: initialData?.leader_name || null,
    leader_email: initialData?.leader_email || null,
    team_size: initialData?.team_size || 5,
    is_active: initialData?.is_active ?? true,
  };

  const handleSubmit = async (
    values: TeamFormData,
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
        setStatus({ type: 'error', message: result.error || 'Error al procesar el equipo' });
        return;
      }

      setStatus({ type: 'success', message: 'Equipo procesado exitosamente' });
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
            {mode === 'create' ? 'Nuevo Equipo' : 'Editar Equipo'}
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
                {/* Nombre del equipo */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="name"
                    label="Nombre del Equipo"
                    value={values.name}
                    onChange={e => setFieldValue('name', e.target.value)}
                    error={touched.name && !!errors.name}
                    helperText={touched.name && errors.name}
                    required
                  />
                </Grid>

                {/* Selección de proyecto */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth error={touched.project_id && !!errors.project_id} disabled={mode === 'edit' || projectsLoading}>
                    <InputLabel>Proyecto</InputLabel>
                    <Select
                      name="project_id"
                      value={values.project_id}
                      onChange={e => setFieldValue('project_id', e.target.value)}
                      label="Proyecto"
                      required
                    >
                      {projects
                        .filter(project => project.status === 'active')
                        .map(project => (
                          <MenuItem key={project.id} value={project.id}>
                            {project.name} ({project.status})
                          </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>
                      {touched.project_id && errors.project_id
                        ? errors.project_id
                        : mode === 'edit'
                        ? 'No se puede cambiar el proyecto en modo edición'
                        : 'Seleccione el proyecto al que pertenecerá este equipo'}
                    </FormHelperText>
                  </FormControl>
                </Grid>

                {/* Nombre del líder */}
                <Grid sx={{ display: 'none' }} size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    name="leader_name"
                    label="Nombre del Líder"
                    value={values.leader_name}
                    onChange={e => setFieldValue('leader_name', e.target.value)}
                    error={touched.leader_name && !!errors.leader_name}
                    helperText={(touched.leader_name && errors.leader_name) || 'Opcional: Nombre del líder del equipo'}
                  />
                </Grid>

                {/* Email del líder */}
                <Grid sx={{ display: 'none' }} size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="email"
                    name="leader_email"
                    label="Email del Líder"
                    value={values.leader_email}
                    onChange={e => setFieldValue('leader_email', e.target.value)}
                    error={touched.leader_email && !!errors.leader_email}
                    helperText={(touched.leader_email && errors.leader_email) || 'Opcional: Email del líder del equipo'}
                  />
                </Grid>

                {/* Tamaño del equipo */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    name="team_size"
                    label="Tamaño del Equipo"
                    value={values.team_size}
                    onChange={e => setFieldValue('team_size', parseInt(e.target.value) || 0)}
                    error={touched.team_size && !!errors.team_size}
                    helperText={(touched.team_size && errors.team_size) || 'Número total de miembros incluyendo el líder'}
                    inputProps={{ min: 2, max: 50 }}
                    required
                  />
                </Grid>

                {/* Estado activo */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControlLabel
                    control={<Switch checked={values.is_active} onChange={e => setFieldValue('is_active', e.target.checked)} />}
                    label="Equipo Activo"
                    sx={{ ml: 0 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Los equipos inactivos no podrán recibir nuevas invitaciones ni realizar evaluaciones
                  </Typography>
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
                      {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear Equipo' : 'Actualizar Equipo'}
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
