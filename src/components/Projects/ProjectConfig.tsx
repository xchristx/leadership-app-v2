// ============================================================================
// COMPONENTE PROJECT CONFIG
// ============================================================================
// Configuración avanzada de proyectos (fechas límite, recordatorios, etc.)
// ============================================================================

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  FormGroup,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Divider,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  NotificationsActive as NotificationsIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import type { Project } from '../../types';

export interface ProjectConfigProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onSave: (config: ProjectConfiguration) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export interface ProjectConfiguration {
  allow_re_evaluation: boolean;
  require_evaluator_info: boolean;
  evaluation_deadline?: Date | null;
  reminder_days: number[];
  email_notifications: boolean;
  auto_reminders: boolean;
  custom_reminder_message?: string;
  max_evaluations_per_evaluator?: number;
  anonymous_evaluations: boolean;
  show_partial_results: boolean;
}

const DEFAULT_REMINDER_DAYS = [7, 3, 1];

export function ProjectConfig({ open, project, onClose, onSave, loading = false }: ProjectConfigProps) {
  const [config, setConfig] = useState<ProjectConfiguration>({
    allow_re_evaluation: false,
    require_evaluator_info: true,
    evaluation_deadline: null,
    reminder_days: DEFAULT_REMINDER_DAYS,
    email_notifications: true,
    auto_reminders: true,
    custom_reminder_message: '',
    max_evaluations_per_evaluator: 1,
    anonymous_evaluations: false,
    show_partial_results: false,
  });

  const [newReminderDay, setNewReminderDay] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Cargar configuración actual del proyecto
  useEffect(() => {
    if (project?.configuration) {
      setConfig({
        allow_re_evaluation: project.configuration.allow_re_evaluation || false,
        require_evaluator_info: project.configuration.require_evaluator_info ?? true,
        evaluation_deadline: project.configuration.evaluation_deadline ? new Date(project.configuration.evaluation_deadline) : null,
        reminder_days: project.configuration.reminder_days || DEFAULT_REMINDER_DAYS,
        email_notifications: project.configuration.email_notifications ?? true,
        auto_reminders: true,
        custom_reminder_message: '',
        max_evaluations_per_evaluator: 1,
        anonymous_evaluations: false,
        show_partial_results: false,
      });
    }
  }, [project]);

  const handleSave = async () => {
    try {
      setError(null);

      // Validaciones
      if (config.evaluation_deadline && config.evaluation_deadline < new Date()) {
        setError('La fecha límite no puede ser en el pasado');
        return;
      }

      if (config.reminder_days.length === 0) {
        setError('Debe configurar al menos un día de recordatorio');
        return;
      }

      const result = await onSave(config);

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Error al guardar la configuración');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  const addReminderDay = () => {
    const day = parseInt(newReminderDay);
    if (day && day > 0 && day <= 365 && !config.reminder_days.includes(day)) {
      setConfig(prev => ({
        ...prev,
        reminder_days: [...prev.reminder_days, day].sort((a, b) => b - a),
      }));
      setNewReminderDay('');
    }
  };

  const removeReminderDay = (day: number) => {
    setConfig(prev => ({
      ...prev,
      reminder_days: prev.reminder_days.filter(d => d !== day),
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">Configuración Avanzada - {project?.name}</Typography>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            {/* Configuración general */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Configuración General
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label="Fecha límite de evaluaciones"
                    value={config.evaluation_deadline}
                    onChange={newValue => setConfig(prev => ({ ...prev, evaluation_deadline: newValue }))}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: 'Fecha después de la cual no se pueden realizar evaluaciones',
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Máximo de evaluaciones por evaluador</InputLabel>
                    <Select
                      value={config.max_evaluations_per_evaluator}
                      onChange={e =>
                        setConfig(prev => ({
                          ...prev,
                          max_evaluations_per_evaluator: Number(e.target.value),
                        }))
                      }
                      label="Máximo de evaluaciones por evaluador"
                    >
                      <MenuItem value={1}>1 evaluación</MenuItem>
                      <MenuItem value={2}>2 evaluaciones</MenuItem>
                      <MenuItem value={3}>3 evaluaciones</MenuItem>
                      <MenuItem value={0}>Sin límite</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.allow_re_evaluation}
                      onChange={e => setConfig(prev => ({ ...prev, allow_re_evaluation: e.target.checked }))}
                    />
                  }
                  label="Permitir re-evaluaciones"
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                  Permite a los evaluadores modificar sus respuestas después de enviarlas
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.require_evaluator_info}
                      onChange={e => setConfig(prev => ({ ...prev, require_evaluator_info: e.target.checked }))}
                    />
                  }
                  label="Requerir información del evaluador"
                  sx={{ mt: 2 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                  Solicitar nombre y email antes de comenzar la evaluación
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.anonymous_evaluations}
                      onChange={e => setConfig(prev => ({ ...prev, anonymous_evaluations: e.target.checked }))}
                    />
                  }
                  label="Evaluaciones anónimas"
                  sx={{ mt: 2 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                  Los resultados no mostrarán información del evaluador
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.show_partial_results}
                      onChange={e => setConfig(prev => ({ ...prev, show_partial_results: e.target.checked }))}
                    />
                  }
                  label="Mostrar resultados parciales"
                  sx={{ mt: 2 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                  Permitir ver resultados antes de completar todas las evaluaciones
                </Typography>
              </FormGroup>
            </Paper>

            {/* Configuración de notificaciones */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Notificaciones y Recordatorios
              </Typography>

              <FormGroup sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.email_notifications}
                      onChange={e => setConfig(prev => ({ ...prev, email_notifications: e.target.checked }))}
                    />
                  }
                  label="Activar notificaciones por email"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={config.auto_reminders}
                      onChange={e => setConfig(prev => ({ ...prev, auto_reminders: e.target.checked }))}
                      disabled={!config.email_notifications}
                    />
                  }
                  label="Recordatorios automáticos"
                  sx={{ ml: 3 }}
                />
              </FormGroup>

              {/* Días de recordatorio */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Días de recordatorio antes de la fecha límite
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {config.reminder_days.map(day => (
                    <Chip
                      key={day}
                      label={`${day} días`}
                      onDelete={() => removeReminderDay(day)}
                      deleteIcon={<DeleteIcon />}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    type="number"
                    label="Días"
                    value={newReminderDay}
                    onChange={e => setNewReminderDay(e.target.value)}
                    size="small"
                    inputProps={{ min: 1, max: 365 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addReminderDay}
                    disabled={!newReminderDay || config.reminder_days.includes(parseInt(newReminderDay))}
                    size="small"
                  >
                    Agregar
                  </Button>
                </Box>
              </Box>

              {/* Mensaje personalizado */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Mensaje personalizado para recordatorios"
                value={config.custom_reminder_message}
                onChange={e => setConfig(prev => ({ ...prev, custom_reminder_message: e.target.value }))}
                placeholder="Escribe un mensaje personalizado que se enviará en los recordatorios por email..."
                helperText="Si se deja vacío, se usará el mensaje predeterminado del sistema"
              />
            </Paper>

            {/* Resumen de configuración */}
            <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                Resumen de Configuración
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Re-evaluaciones" secondary={config.allow_re_evaluation ? 'Permitidas' : 'No permitidas'} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Información del evaluador" secondary={config.require_evaluator_info ? 'Requerida' : 'Opcional'} />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Fecha límite"
                    secondary={config.evaluation_deadline ? config.evaluation_deadline.toLocaleDateString('es-ES') : 'No definida'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Recordatorios"
                    secondary={config.reminder_days.length > 0 ? `${config.reminder_days.join(', ')} días antes` : 'No configurados'}
                  />
                </ListItem>
              </List>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={loading} startIcon={<SaveIcon />}>
            Guardar Configuración
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
