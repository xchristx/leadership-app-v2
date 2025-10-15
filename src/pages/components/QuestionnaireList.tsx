// ============================================================================
// COMPONENTE DE LISTA DE CUESTIONARIOS
// ============================================================================

import {
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  Box,
  Button,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as PreviewIcon, Quiz as QuizIcon, Add as AddIcon } from '@mui/icons-material';
import { useState } from 'react';
import type { Database } from '../../types/database.types';

type QuestionTemplate = Database['public']['Tables']['question_templates']['Row'];

interface QuestionnaireListProps {
  templates: QuestionTemplate[];
  loading: boolean;
  organizationId?: string;
  onView: (template: QuestionTemplate) => void;
  onEdit: (template: QuestionTemplate) => void;
  onDelete: (templateId: string) => void;
  onCreate: () => void;
}

export function QuestionnaireList({ templates, loading, organizationId, onView, onEdit, onDelete, onCreate }: QuestionnaireListProps) {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; templateId: string | null; templateName: string }>({
    open: false,
    templateId: null,
    templateName: '',
  });

  const handleDeleteClick = (template: QuestionTemplate) => {
    setDeleteDialog({
      open: true,
      templateId: template.id,
      templateName: template.title,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.templateId) {
      onDelete(deleteDialog.templateId);
      setDeleteDialog({ open: false, templateId: null, templateName: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, templateId: null, templateName: '' });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando cuestionarios...
        </Typography>
      </Box>
    );
  }

  if (templates.length === 0) {
    return (
      <Card sx={{ textAlign: 'center', py: 6 }}>
        <CardContent>
          <QuizIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay cuestionarios creados
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Crea tu primer cuestionario para comenzar a evaluar equipos de liderazgo
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={onCreate} disabled={!organizationId}>
            Crear primer cuestionario
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {templates.map(template => (
          <Grid key={template.id} size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme => theme.shadows[4],
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <QuizIcon color="primary" sx={{ mr: 1, mt: 0.5, fontSize: 20 }} />
                  <Typography variant="h6" gutterBottom noWrap sx={{ flexGrow: 1, fontSize: '1.1rem' }}>
                    {template.title}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    minHeight: '4.5em',
                    mb: 2,
                  }}
                >
                  {template.description || 'Sin descripción disponible'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip
                    label={template.is_active ? 'Activo' : 'Inactivo'}
                    size="small"
                    color={template.is_active ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip label="Template" size="small" color="primary" variant="outlined" />
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Creado: {new Date(template.created_at).toLocaleDateString('es-ES')}
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <IconButton size="small" color="primary" title="Vista previa" onClick={() => onView(template)}>
                  <PreviewIcon />
                </IconButton>
                <IconButton size="small" color="default" title="Editar" onClick={() => onEdit(template)}>
                  <EditIcon />
                </IconButton>
                <IconButton size="small" color="error" title="Eliminar" onClick={() => handleDeleteClick(template)}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog de confirmación para eliminar */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            ¿Estás seguro de que deseas eliminar el cuestionario
            <strong> "{deleteDialog.templateName}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Esta acción desactivará el template y todas sus preguntas asociadas.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Los proyectos que ya usen este cuestionario no se verán afectados, pero no se podrá asignar a nuevos proyectos.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
