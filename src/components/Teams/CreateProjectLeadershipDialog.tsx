// ============================================================================
// DIÁLOGO PARA CREAR EQUIPO DE LIDERAZGO DE PROYECTO
// ============================================================================
// Modal para configurar la evaluación de liderazgo del proyecto
// ============================================================================

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';
import { Star as StarIcon, Person as PersonIcon, Group as GroupIcon, Check as CheckIcon, Info as InfoIcon } from '@mui/icons-material';
import { createProjectLeadershipTeam } from '../../services/projectLeadershipService';

interface CreateProjectLeadershipDialogProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  projectId: string;
  onSuccess: () => void;
}

export function CreateProjectLeadershipDialog({ open, onClose, projectName, projectId, onSuccess }: CreateProjectLeadershipDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await createProjectLeadershipTeam({
        project_id: projectId,
        project_name: projectName,
      });

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Error al crear evaluación de liderazgo');
      }
    } catch {
      setError('Error inesperado al crear evaluación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon color="primary" fontSize="large" />
          <Typography variant="h5" component="div">
            Configurar Evaluación de Liderazgo del Proyecto
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
          Esta evaluación permitirá que <strong>los líderes de equipo evalúen al líder del proyecto</strong>. El líder del proyecto también
          podrá <strong>autoevaluarse</strong>.
        </Alert>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'primary.50',
            borderColor: 'primary.200',
          }}
        >
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            📋 Proyecto: {projectName}
          </Typography>
        </Paper>

        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" gutterBottom color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
            Se generarán las siguientes invitaciones:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <PersonIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    1 invitación para el Líder del Proyecto
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    Autoevaluación · Rol: Líder
                  </Typography>
                }
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <GroupIcon color="secondary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    1 invitación para todos los Líderes de Equipo
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    Evaluación del líder del proyecto · Rol: Colaboradores
                  </Typography>
                }
              />
            </ListItem>
          </List>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Importante:</strong> Los datos de los evaluadores (nombre y email) se completarán automáticamente cuando cada persona
              acceda a su enlace de invitación único.
            </Typography>
          </Alert>
        </Box>

        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'info.50',
            borderRadius: 1,
            border: '1px dashed',
            borderColor: 'info.main',
          }}
        >
          <Typography variant="body2" color="info.dark">
            💡 <strong>Nota:</strong> Podrás ver y copiar los enlaces de invitación una vez creada la evaluación. Comparte el enlace de
            "Líder" con el líder del proyecto y el enlace de "Colaboradores" con todos los líderes de equipo.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} size="large">
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleCreate} disabled={loading} startIcon={<CheckIcon />} size="large">
          {loading ? 'Creando...' : 'Crear Evaluación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
