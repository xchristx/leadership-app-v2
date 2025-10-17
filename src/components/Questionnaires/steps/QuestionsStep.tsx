// ============================================================================
// PASO 3: GESTIÓN DE PREGUNTAS
// ============================================================================

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, DragIndicator as DragIcon } from '@mui/icons-material';
import type { QuestionnaireFormData, QuestionFormData, QuestionType } from '../types';

interface QuestionsStepProps {
  values: QuestionnaireFormData;
  setFieldValue: (field: string, value: unknown) => void;
}

const questionTypes = [
  { value: 'likert' as QuestionType, label: 'Escala Likert (Recomendado)', description: 'Escala numérica (ej: 1-5)' },
  // { value: 'text' as QuestionType, label: 'Texto Libre', description: 'Respuesta abierta' },
  // { value: 'multiple_choice' as QuestionType, label: 'Opción Múltiple', description: 'Selección única' },
];

export function QuestionsStep({ values, setFieldValue }: QuestionsStepProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionFormData | null>(null);
  const [questionData, setQuestionData] = useState<QuestionFormData>({
    text_leader: '',
    text_collaborator: '',
    category_id: '',
    order_index: 0,
    question_type: 'likert',
    response_config: {
      scale: 5,
      min_label: 'Muy frecuentemente',
      max_label: 'Rara vez o Nunca',
    },
    is_active: true,
  });

  const resetQuestionData = () => {
    setQuestionData({
      text_leader: '',
      text_collaborator: '',
      category_id: values.use_categories ? values.categories[0]?.id || '' : '',
      order_index: values.questions.length,
      question_type: 'likert',
      response_config: {
        scale: 5,
        min_label: 'Muy frecuentemente',
        max_label: 'Rara vez o Nunca',
      },
      is_active: true,
    });
  };

  const handleOpenDialog = (question?: QuestionFormData) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionData({ ...question });
    } else {
      setEditingQuestion(null);
      resetQuestionData();
    }
    setDialogOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!questionData.text_leader.trim() || !questionData.text_collaborator.trim()) {
      return;
    }

    if (values.use_categories && !questionData.category_id) {
      return;
    }

    const newQuestion: QuestionFormData = {
      ...questionData,
      id: editingQuestion?.id || `q_${Date.now()}`,
      text_leader: questionData.text_leader.trim(),
      text_collaborator: questionData.text_collaborator.trim(),
      order_index: editingQuestion?.order_index ?? values.questions.length,
    };

    let updatedQuestions;
    if (editingQuestion) {
      updatedQuestions = values.questions.map(q => (q.id === editingQuestion.id ? newQuestion : q));
    } else {
      updatedQuestions = [...values.questions, newQuestion];
    }

    setFieldValue('questions', updatedQuestions);
    setDialogOpen(false);
    resetQuestionData();
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestions = values.questions.filter(q => q.id !== questionId);
    setFieldValue('questions', updatedQuestions);
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    return questionTypes.find(qt => qt.value === type)?.label || type;
  };

  const getCategoryName = (categoryId: string) => {
    return values.categories.find(cat => cat.id === categoryId)?.name || 'Sin categoría';
  };

  const renderQuestionPreview = (question: QuestionFormData) => {
    const isLeader = values.version_type !== 'collaborator';
    const isCollaborator = values.version_type !== 'leader';

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <IconButton>
              <DragIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Chip label={getQuestionTypeLabel(question.question_type)} size="small" />
                {values.use_categories && question.category_id && (
                  <Chip label={getCategoryName(question.category_id)} size="small" color="primary" />
                )}
              </Box>

              <Grid container spacing={2}>
                {isLeader && (
                  <Grid size={{ xs: 12, md: isCollaborator ? 6 : 12 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Vista Líder:
                    </Typography>
                    <Typography variant="body2">{question.text_leader}</Typography>
                  </Grid>
                )}

                {isCollaborator && (
                  <Grid size={{ xs: 12, md: isLeader ? 6 : 12 }}>
                    <Typography variant="subtitle2" color="secondary" gutterBottom>
                      Vista Colaborador:
                    </Typography>
                    <Typography variant="body2">{question.text_collaborator}</Typography>
                  </Grid>
                )}
              </Grid>

              {question.question_type === 'likert' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Escala: 1 ({question.response_config.min_label}) - {question.response_config.scale} (
                    {question.response_config.max_label})
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>

        <CardActions>
          <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenDialog(question)}>
            Editar
          </Button>
          <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteQuestion(question.id!)}>
            Eliminar
          </Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Preguntas ({values.questions.length})</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={values.use_categories && values.categories.length === 0}
        >
          Agregar Pregunta
        </Button>
      </Box>

      {values.use_categories && values.categories.length === 0 && (
        <Alert severity="warning">Debe crear al menos una categoría antes de agregar preguntas</Alert>
      )}

      {/* Lista de preguntas */}
      {values.questions.length > 0 ? (
        <Box>
          {values.questions.map(question => (
            <div key={question.id}>{renderQuestionPreview(question)}</div>
          ))}
        </Box>
      ) : (
        <Alert severity="info">Aún no has agregado preguntas. Haz clic en "Agregar Pregunta" para comenzar.</Alert>
      )}

      {/* Dialog para crear/editar pregunta */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Categoría (si está habilitada) */}
            {values.use_categories && (
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Categoría *</InputLabel>
                  <Select
                    value={questionData.category_id}
                    onChange={e => setQuestionData({ ...questionData, category_id: e.target.value })}
                  >
                    {values.categories.map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Tipo de pregunta */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Pregunta</InputLabel>
                <Select
                  value={questionData.question_type}
                  onChange={e =>
                    setQuestionData({
                      ...questionData,
                      question_type: e.target.value as QuestionType,
                    })
                  }
                >
                  {questionTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Estado activo */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={questionData.is_active}
                    onChange={e => setQuestionData({ ...questionData, is_active: e.target.checked })}
                  />
                }
                label="Pregunta Activa"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
            </Grid>

            {/* Textos de la pregunta */}
            {(values.version_type === 'both' || values.version_type === 'leader') && (
              <Grid size={{ xs: 12, md: values.version_type === 'both' ? 6 : 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Pregunta para Líderes *"
                  value={questionData.text_leader}
                  onChange={e => setQuestionData({ ...questionData, text_leader: e.target.value })}
                  placeholder="Cómo formularias esta pregunta para un líder..."
                />
              </Grid>
            )}

            {(values.version_type === 'both' || values.version_type === 'collaborator') && (
              <Grid size={{ xs: 12, md: values.version_type === 'both' ? 6 : 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Pregunta para Colaboradores *"
                  value={questionData.text_collaborator}
                  onChange={e => setQuestionData({ ...questionData, text_collaborator: e.target.value })}
                  placeholder="Cómo formularias esta pregunta para un colaborador..."
                />
              </Grid>
            )}

            {/* Configuración específica por tipo */}
            {questionData.question_type === 'likert' && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Configuración de Escala Likert
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Número de Puntos"
                    value={questionData.response_config.scale}
                    onChange={e =>
                      setQuestionData({
                        ...questionData,
                        response_config: {
                          ...questionData.response_config,
                          scale: parseInt(e.target.value) || 5,
                        },
                      })
                    }
                    inputProps={{ min: 3, max: 10 }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Etiqueta Mínima"
                    value={questionData.response_config.min_label}
                    onChange={e =>
                      setQuestionData({
                        ...questionData,
                        response_config: {
                          ...questionData.response_config,
                          min_label: e.target.value,
                        },
                      })
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Etiqueta Máxima"
                    value={questionData.response_config.max_label}
                    onChange={e =>
                      setQuestionData({
                        ...questionData,
                        response_config: {
                          ...questionData.response_config,
                          max_label: e.target.value,
                        },
                      })
                    }
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSaveQuestion}
            variant="contained"
            disabled={
              !questionData.text_leader.trim() ||
              !questionData.text_collaborator.trim() ||
              (values.use_categories && !questionData.category_id)
            }
          >
            {editingQuestion ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
