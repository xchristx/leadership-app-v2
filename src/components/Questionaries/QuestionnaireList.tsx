// ============================================================================
// COMPONENTE DE LISTA DE CUESTIONARIOS - DISEÑO MEJORADO
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
  alpha,
  useTheme,
  Zoom,
  useMediaQuery,
  Tooltip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as PreviewIcon,
  Quiz as QuizIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Psychology as PsychologyIcon,
  Group as GroupIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  // Función para obtener el icono según el tipo de template
  const getTemplateIcon = (templateType?: string) => {
    switch (templateType) {
      case 'leadership':
        return <PsychologyIcon />;
      case 'team':
        return <GroupIcon />;
      default:
        return <QuizIcon />;
    }
  };

  // Función para obtener el color según el tipo de template
  const getTemplateColor = (templateType?: string) => {
    switch (templateType) {
      case 'leadership':
        return theme.palette.warning.main;
      case 'team':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  // Función para obtener el label del tipo de template
  const getTemplateTypeLabel = (templateType?: string) => {
    switch (templateType) {
      case 'leadership':
        return 'Liderazgo';
      case 'team':
        return 'Equipo';
      default:
        return 'General';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8, flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={40} />
        <Typography variant="h6" color="text.secondary">
          Cargando cuestionarios...
        </Typography>
      </Box>
    );
  }

  if (templates.length === 0) {
    return (
      <Zoom in timeout={600}>
        <Card
          sx={{
            textAlign: 'center',
            py: 8,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(
              theme.palette.secondary.main,
              0.02
            )} 100%)`,
            border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
            borderRadius: 3,
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                mb: 3,
              }}
            >
              <QuizIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h5" color="text.secondary" gutterBottom fontWeight={600}>
              No hay cuestionarios creados
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
              Crea tu primer cuestionario para comenzar a evaluar equipos de liderazgo y mejorar el desarrollo organizacional
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreate}
              disabled={!organizationId}
              size="large"
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                },
                transition: 'all 0.3s ease',
              }}
            >
              Crear Primer Cuestionario
            </Button>
          </CardContent>
        </Card>
      </Zoom>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {templates.map((template, index) => (
          <Grid key={template.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Zoom in timeout={800} style={{ transitionDelay: `${index * 100}ms` }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(
                    theme.palette.primary.main,
                    0.02
                  )} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease-in-out',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 16px 48px ${alpha(theme.palette.primary.main, 0.15)}`,
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                  },
                }}
                onClick={() => onView(template)}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  {/* Header con icono y estado */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          bgcolor: alpha(getTemplateColor(template.version_type || ''), 0.1),
                          color: getTemplateColor(template.version_type || ''),
                          width: 48,
                          height: 48,
                        }}
                      >
                        {getTemplateIcon(template.version_type || '')}
                      </Avatar>
                      <Box>
                        <Chip
                          label={getTemplateTypeLabel(template.version_type || '')}
                          size="small"
                          sx={{
                            bgcolor: alpha(getTemplateColor(template.version_type || ''), 0.1),
                            color: getTemplateColor(template.version_type || ''),
                            fontWeight: 600,
                            mb: 0.5,
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {template.is_active ? (
                            <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          ) : (
                            <CancelIcon sx={{ fontSize: 16, color: 'error.main' }} />
                          )}
                          <Chip
                            label={template.is_active ? 'Activo' : 'Inactivo'}
                            size="small"
                            color={template.is_active ? 'success' : 'default'}
                            variant="outlined"
                            sx={{ fontWeight: 600, height: 20 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        },
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        // Menú de opciones podría ir aquí
                      }}
                    >
                      <MoreIcon />
                    </IconButton>
                  </Box>

                  {/* Título y descripción */}
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      fontSize: '1.2rem',
                      lineHeight: 1.3,
                      mb: 2,
                      color: theme.palette.text.primary,
                      minHeight: '2.6em',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {template.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.5,
                      minHeight: '4.5em',
                      mb: 3,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {template.description || 'Este cuestionario no tiene descripción disponible. Puedes editar para agregar una.'}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Metadata */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(template.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      ID: #{template.id.slice(0, 6)}
                    </Typography>
                  </Box>
                </CardContent>

                {/* Acciones */}
                <CardActions
                  sx={{
                    p: 2,
                    pt: 0,
                    gap: 1,
                    '& > *': {
                      flex: 1,
                    },
                  }}
                >
                  <Tooltip title="Vista previa">
                    <Button
                      size="small"
                      startIcon={<PreviewIcon />}
                      onClick={e => {
                        e.stopPropagation();
                        onView(template);
                      }}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                      }}
                    >
                      {isMobile ? '' : 'Ver'}
                    </Button>
                  </Tooltip>

                  <Tooltip title="Editar cuestionario">
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      color="primary"
                      variant="outlined"
                      onClick={e => {
                        e.stopPropagation();
                        onEdit(template);
                      }}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                      }}
                    >
                      {isMobile ? '' : 'Editar'}
                    </Button>
                  </Tooltip>

                  <Tooltip title="Eliminar cuestionario">
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      color="error"
                      variant="outlined"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteClick(template);
                      }}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                        textTransform: 'none',
                      }}
                    >
                      {isMobile ? '' : 'Eliminar'}
                    </Button>
                  </Tooltip>
                </CardActions>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
            color: 'white',
            fontWeight: 700,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon />
            Confirmar Eliminación
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            ¿Eliminar cuestionario?
          </Typography>
          <Typography gutterBottom sx={{ mb: 2 }}>
            Estás a punto de eliminar el cuestionario:
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 600, ml: 0.5 }}>
              "{deleteDialog.templateName}"
            </Box>
          </Typography>

          <Alert
            severity="warning"
            sx={{
              mb: 2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.warning.light}`,
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              Acción irreversible
            </Typography>
            <Typography variant="caption">Esta acción desactivará el template y todas sus preguntas asociadas permanentemente.</Typography>
          </Alert>

          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              border: `1px solid ${theme.palette.info.light}`,
            }}
          >
            <Typography variant="caption">
              Los proyectos que ya usen este cuestionario no se verán afectados, pero no se podrá asignar a nuevos proyectos.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleDeleteCancel} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            startIcon={<DeleteIcon />}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`,
              },
            }}
          >
            Eliminar Definitivamente
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
