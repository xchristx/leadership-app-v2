// ============================================================================
// COMPONENTE EVALUATION VIEWER
// ============================================================================
// Modal para visualizar evaluaciones completadas con respuestas
// ============================================================================

import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Grid,
  Divider,
  Alert,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  AccessTime as TimeIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';

import { supabase } from '../../lib/supabase';
import type { Evaluation, Question, Team, Project } from '../../types';

interface EvaluationViewerProps {
  open: boolean;
  evaluationId: string | null;
  onClose: () => void;
}

interface EvaluationWithDetails {
  evaluation: Evaluation;
  questions: Question[];
  responses: Record<string, string | number>;
  team: Team;
  project: Project;
  metadata?: {
    completion_time_seconds?: number;
    device_info?: string;
    version?: string;
  };
}

export function EvaluationViewer({ open, evaluationId, onClose }: EvaluationViewerProps) {
  const [data, setData] = useState<EvaluationWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && evaluationId) {
      loadEvaluationDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, evaluationId]);

  const loadEvaluationDetails = useCallback(async () => {
    if (!evaluationId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Obtener evaluación con datos relacionados
      const { data: evaluation, error: evalError } = await supabase
        .from('evaluations')
        .select(
          `
          *,
          teams!inner(
            id,
            name,
            leader_name,
            projects!inner(
              id,
              name,
              template_id,
              question_templates!inner(
                id,
                title,
                description
              )
            )
          )
        `
        )
        .eq('id', evaluationId)
        .single();

      if (evalError) {
        throw new Error(`Error al cargar evaluación: ${evalError.message}`);
      }

      // 2. Obtener preguntas del template
      const evalWithRelations = evaluation as {
        teams: {
          projects: { template_id: string };
        };
      } & typeof evaluation;
      const templateId = evalWithRelations.teams.projects.template_id;

      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .order('order_index');

      if (questionsError) {
        throw new Error(`Error al cargar preguntas: ${questionsError.message}`);
      }

      // 3. Obtener respuestas
      const responses: Record<string, string | number> = {};
      let metadata: Record<string, unknown> = {};

      // Intentar obtener del campo JSON primero
      if (evaluation.responses_data && evaluation.responses_data !== '{}') {
        try {
          const jsonData =
            typeof evaluation.responses_data === 'string' ? JSON.parse(evaluation.responses_data) : evaluation.responses_data;

          if (jsonData.responses) {
            // Convertir formato JSON a formato simple
            Object.entries(jsonData.responses).forEach(([questionId, responseData]) => {
              if (responseData && typeof responseData === 'object' && 'value' in responseData) {
                responses[questionId] = responseData.value as string | number;
              }
            });
            metadata = jsonData.metadata || {};
          }
        } catch {
          console.warn('Error parsing JSON responses, falling back to individual responses');
        }
      }

      // Fallback: obtener respuestas individuales
      if (Object.keys(responses).length === 0) {
        const { data: individualResponses } = await supabase.from('evaluation_responses').select('*').eq('evaluation_id', evaluationId);

        if (individualResponses) {
          individualResponses.forEach(response => {
            const value = response.response_value || response.response_text;
            if (value !== null) {
              responses[response.question_id] = value;
            }
          });
        }
      }

      setData({
        evaluation: evaluation as Evaluation,
        questions: (questions || []) as Question[],
        responses,
        team: evalWithRelations.teams as unknown as Team,
        project: evalWithRelations.teams.projects as unknown as Project,
        metadata: metadata as EvaluationWithDetails['metadata'],
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [evaluationId]);

  const handleClose = () => {
    setData(null);
    setError(null);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'No disponible';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderQuestionResponse = (question: Question, response: string | number | undefined) => {
    const config = question.response_config as Record<string, unknown>;
    const isLeader = data?.evaluation.evaluator_role === 'leader';
    const questionText = isLeader ? question.text_leader : question.text_collaborator;

    if (question.question_type === 'likert') {
      const scale = (config?.scale as number) || 5;
      const labels = config?.labels as string[] | undefined;
      const value = typeof response === 'number' ? response : 0;
      const percentage = (value / scale) * 100;

      return (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Box
              sx={{
                minWidth: 32,
                height: 32,
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.875rem',
              }}
            >
              {question.order_index + 1}
            </Box>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {questionText}
            </Typography>
            <Chip
              label={`${value}/${scale}`}
              color={value >= scale * 0.7 ? 'success' : value >= scale * 0.4 ? 'warning' : 'error'}
              variant="filled"
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 12,
                borderRadius: 6,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6,
                  backgroundColor: value >= scale * 0.7 ? 'success.main' : value >= scale * 0.4 ? 'warning.main' : 'error.main',
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {(config?.min_label as string) || 'Mínimo'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(config?.max_label as string) || 'Máximo'}
              </Typography>
            </Box>
          </Box>

          {labels && labels[value - 1] && (
            <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'medium', textAlign: 'center' }}>
              "{labels[value - 1]}"
            </Typography>
          )}
        </Paper>
      );
    }

    if (question.question_type === 'text') {
      return (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Box
              sx={{
                minWidth: 32,
                height: 32,
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.875rem',
              }}
            >
              {question.order_index + 1}
            </Box>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {questionText}
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {response || 'Sin respuesta'}
            </Typography>
          </Paper>
        </Paper>
      );
    }

    if (question.question_type === 'multiple_choice') {
      return (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Box
              sx={{
                minWidth: 32,
                height: 32,
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.875rem',
              }}
            >
              {question.order_index + 1}
            </Box>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {questionText}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              {response || 'Sin respuesta'}
            </Typography>
          </Box>
        </Paper>
      );
    }

    return null;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AssessmentIcon color="primary" />
          <Typography variant="h6">Evaluación Completada</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {isLoading && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography>Cargando evaluación...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {data && (
          <Box sx={{ p: 3 }}>
            {/* Header de información */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Información básica
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Nombre:</strong> {data.evaluation.evaluator_name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Email:</strong> {data.evaluation.evaluator_email}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssessmentIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Rol:</strong> {data.evaluation.evaluator_role === 'leader' ? 'Líder' : 'Colaborador'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Detalles de la Evaluación
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Proyecto:</strong> {data.project.name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Equipo:</strong> {data.team.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Completada:</strong> {formatDate(data.evaluation.completed_at)}
                        </Typography>
                      </Box>
                      {data.metadata?.completion_time_seconds && (
                        <Typography variant="body2">
                          <strong>Tiempo:</strong> {formatDuration(data.metadata.completion_time_seconds)}
                        </Typography>
                      )}
                      {data.metadata?.device_info && (
                        <Typography variant="body2">
                          <strong>Dispositivo:</strong> {data.metadata.device_info}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            {/* Respuestas */}
            <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
              Respuestas del Cuestionario
            </Typography>

            {data.questions.length > 0 ? (
              data.questions.map(question => <Box key={question.id}>{renderQuestionResponse(question, data.responses[question.id])}</Box>)
            ) : (
              <Alert severity="info">No hay preguntas disponibles para esta evaluación.</Alert>
            )}

            {/* Resumen */}
            <Card sx={{ mt: 4, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumen de la Evaluación
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="body2">
                      <strong>Total preguntas:</strong> {data.questions.length}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="body2">
                      <strong>Respondidas:</strong> {Object.keys(data.responses).length}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="body2">
                      <strong>Progreso:</strong> {data.evaluation.completion_percentage}%
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="body2">
                      <strong>Estado:</strong> {data.evaluation.is_complete ? 'Completa' : 'Incompleta'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
        <Button onClick={handleClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
