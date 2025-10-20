// ============================================================================
// PASO 1: INFORMACIÓN BÁSICA DEL CUESTIONARIO
// ============================================================================

import {
  Box,
  Grid,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Typography,
  Divider,
} from '@mui/material';
import type { QuestionnaireFormData } from '../types';

interface BasicInfoStepProps {
  values: QuestionnaireFormData;
  setFieldValue: (field: string, value: any) => void;
}

export function BasicInfoStep({ values, setFieldValue }: BasicInfoStepProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        Información Básica del Cuestionario
      </Typography>

      {/* Tipo de versión */}
      <FormControl component="fieldset">
        <FormLabel component="legend">Tipo de Cuestionario</FormLabel>
        <RadioGroup value={values.version_type} onChange={e => setFieldValue('version_type', e.target.value)}>
          <FormControlLabel value="both" control={<Radio />} label="Para Líderes y Colaboradores (Recomendado)" />
          <FormControlLabel value="leader" control={<Radio />} label="Solo para Líderes" />
          <FormControlLabel value="collaborator" control={<Radio />} label="Solo para Colaboradores" />
        </RadioGroup>
      </FormControl>

      <Divider />

      {/* Títulos */}
      <Typography variant="h6" gutterBottom>
        Títulos del Cuestionario
      </Typography>

      <Grid container spacing={3}>
        {(values.version_type === 'both' || values.version_type === 'leader') && (
          <Grid size={{ xs: 12, md: values.version_type === 'both' ? 6 : 12 }}>
            <TextField
              fullWidth
              label="Título para Líderes *"
              value={values.title_leader}
              onChange={e => setFieldValue('title_leader', e.target.value)}
              placeholder="Ej: Evaluación de Liderazgo - Vista Líder"
              rows={3}
              multiline
            />
          </Grid>
        )}

        {(values.version_type === 'both' || values.version_type === 'collaborator') && (
          <Grid size={{ xs: 12, md: values.version_type === 'both' ? 6 : 12 }}>
            <TextField
              fullWidth
              label="Título para Colaboradores *"
              value={values.title_collaborator}
              onChange={e => setFieldValue('title_collaborator', e.target.value)}
              placeholder="Ej: Evaluación de Liderazgo - Vista Colaborador"
              rows={3}
              multiline
            />
          </Grid>
        )}
      </Grid>

      {/* Descripciones */}
      <Typography variant="h6" gutterBottom>
        Descripciones (Opcional)
      </Typography>

      <Grid container spacing={3}>
        {(values.version_type === 'both' || values.version_type === 'leader') && (
          <Grid size={{ xs: 12, md: values.version_type === 'both' ? 6 : 12 }}>
            <TextField
              fullWidth
              multiline
              rows={5}
              label="Descripción para Líderes"
              value={values.description_leader}
              onChange={e => setFieldValue('description_leader', e.target.value)}
              placeholder="Descripción que verán los líderes al iniciar la evaluación..."
            />
          </Grid>
        )}

        {(values.version_type === 'both' || values.version_type === 'collaborator') && (
          <Grid size={{ xs: 12, md: values.version_type === 'both' ? 6 : 12 }}>
            <TextField
              fullWidth
              multiline
              rows={5}
              label="Descripción para Colaboradores"
              value={values.description_collaborator}
              onChange={e => setFieldValue('description_collaborator', e.target.value)}
              placeholder="Descripción que verán los colaboradores al iniciar la evaluación..."
            />
          </Grid>
        )}
      </Grid>

      <Divider />

      {/* Estado */}
      <Box>
        <FormControlLabel
          control={<Switch checked={values.is_active} onChange={e => setFieldValue('is_active', e.target.checked)} />}
          label="Cuestionario Activo"
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Los cuestionarios activos pueden ser utilizados en nuevos proyectos
        </Typography>
      </Box>
    </Box>
  );
}
