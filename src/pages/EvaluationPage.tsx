// ============================================================================
// PÁGINA DE EVALUACIÓN POR TOKEN - VERSIÓN MEJORADA
// ============================================================================
// Página pública para evaluaciones con configuraciones del proyecto
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControlLabel,
  Chip,
  Paper,
  Radio,
  RadioGroup,
  LinearProgress,
  Grid,
  useMediaQuery,
  alpha,
  useTheme,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Shield } from '@mui/icons-material';

import { supabase } from '../lib/supabase';
import {
  checkEmailEvaluationExists,
  validateEmail,
  validateResponses,
  // Nuevas funciones JSON
  createEvaluationWithJson,
  updateEvaluationWithJson,
  getExistingEvaluationWithJson,
} from '../services/evaluationService';
import type { TeamInvitation, Team, Project, ProjectConfiguration, Question } from '../types';

interface EvaluationPageState {
  invitation: TeamInvitation | null;
  team: Team | null;
  project: Project | null;
  configuration: ProjectConfiguration | null;
  template: {
    id: string;
    title: string;
    description?: string;
  } | null;
  questions: Question[];
  isLoading: boolean;
  error: string | null;
  step: 'loading' | 'info' | 'evaluation' | 'complete' | 'existing-evaluation';
  existingEvaluation: {
    evaluation: object | null;
    responses: object[];
    canEdit: boolean;
  } | null;
}

interface EvaluatorInfo {
  name: string;
  email: string;
  additionalInfo: string;
}

export function EvaluationPage() {
  const { token } = useParams<{ token: string }>();

  const [state, setState] = useState<EvaluationPageState>({
    invitation: null,
    team: null,
    project: null,
    configuration: null,
    template: null,
    questions: [],
    isLoading: true,
    error: null,
    step: 'loading',
    existingEvaluation: null,
  });

  const [evaluatorInfo, setEvaluatorInfo] = useState<EvaluatorInfo>({
    name: '',
    email: '',
    additionalInfo: '',
  });

  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationStartTime] = useState<Date>(new Date()); // Para trackear tiempo de evaluación

  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');

  // Función helper para validar email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const loadInvitationData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 1. Obtener invitación por token
      const { data: invitation, error: invitationError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('unique_token', token!)
        .single();

      if (invitationError || !invitation) {
        throw new Error('Token de invitación no válido o expirado');
      }

      if (!invitation.is_active) {
        throw new Error('Esta invitación ha sido desactivada');
      }

      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        throw new Error('Esta invitación ha expirado');
      }

      if (invitation.max_uses && (invitation.current_uses || 0) >= invitation.max_uses) {
        throw new Error('Esta invitación ha alcanzado el límite máximo de usos');
      }

      // 2. Obtener equipo
      const { data: team, error: teamError } = await supabase.from('teams').select('*').eq('id', invitation.team_id).single();

      if (teamError || !team) {
        throw new Error('Equipo no encontrado');
      }

      // 3. Obtener proyecto con configuración
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`*, project_configurations(*)`)
        .eq('id', team.project_id)
        .single();

      if (projectError || !project) {
        throw new Error('Proyecto no encontrado');
      }

      if (project.status !== 'active') {
        throw new Error('Este proyecto no está disponible para evaluaciones');
      }

      // 4. Obtener template información
      const { data: template, error: templateError } = await supabase
        .from('question_templates')
        .select('id, title, description')
        .eq('id', project.template_id!)
        .single();

      if (templateError) {
        console.warn('Error al cargar template:', templateError);
      }

      // 5. Obtener preguntas de la plantilla
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('template_id', project.template_id!)
        .eq('is_active', true)
        .order('order_index');

      if (questionsError) {
        throw new Error('Error al cargar preguntas');
      }

      const configuration = Array.isArray(project.project_configurations)
        ? project.project_configurations[0]
        : project.project_configurations || null;

      if (configuration?.evaluation_deadline) {
        const deadline = new Date(configuration.evaluation_deadline);
        if (deadline < new Date()) {
          throw new Error('El período de evaluación ha terminado');
        }
      }

      setState({
        invitation: invitation as TeamInvitation,
        team: team as Team,
        project: project as Project,
        configuration: configuration as ProjectConfiguration,
        template: template
          ? {
              id: template.id,
              title: template.title,
              description: template.description || undefined,
            }
          : null,
        questions: (questions || []) as Question[],
        isLoading: false,
        error: null,
        step: configuration?.require_evaluator_info ? 'info' : 'evaluation',
        existingEvaluation: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadInvitationData();
    }
  }, [token, loadInvitationData]);

  const handleEvaluatorInfoSubmit = async () => {
    if (!state.configuration?.require_evaluator_info) {
      setState(prev => ({ ...prev, step: 'evaluation', existingEvaluation: null }));
      return;
    }

    if (!evaluatorInfo.name.trim() || !evaluatorInfo.email.trim()) {
      alert('Por favor completa tu nombre y email');
      return;
    }

    // Validación de formato de email
    if (!isValidEmail(evaluatorInfo.email)) {
      alert('Por favor ingresa un email válido (ejemplo: usuario@dominio.com)');
      return;
    }

    try {
      const emailCheck = await checkEmailEvaluationExists(state.team!.id, evaluatorInfo.email);

      if (emailCheck.exists) {
        if (emailCheck.canEdit) {
          // Intentar usar el nuevo sistema JSON primero
          const existingDataJson = await getExistingEvaluationWithJson(state.team!.id, evaluatorInfo.email);

          if (existingDataJson) {
            setResponses(existingDataJson.responses);

            setState(prev => ({
              ...prev,
              step: 'existing-evaluation',
              existingEvaluation: {
                evaluation: existingDataJson.evaluation,
                responses: Object.entries(existingDataJson.responses).map(([questionId, value]) => ({
                  question_id: questionId,
                  response_value: typeof value === 'number' ? value : null,
                  response_text: typeof value === 'string' ? value : null,
                })),
                canEdit: true,
              },
            }));
          } else {
            setState(prev => ({ ...prev, step: 'evaluation', existingEvaluation: null }));
          }
        } else {
          alert('Ya has completado una evaluación para este equipo y no está permitido editarla.');
          return;
        }
      } else {
        setState(prev => ({ ...prev, step: 'evaluation', existingEvaluation: null }));
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error('Error al verificar email:', error);
      alert('Error al verificar la información. Por favor intenta de nuevo.');
    }
  };

  const handleResponseChange = (questionId: string, value: string | number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmitEvaluation = async () => {
    try {
      setIsSubmitting(true);

      // Validación de email mejorada
      if (!isValidEmail(evaluatorInfo.email)) {
        alert('Por favor ingresa un email válido antes de enviar la evaluación');
        return;
      }

      const emailValidation = validateEmail(evaluatorInfo.email);
      if (!emailValidation.isValid) {
        alert(emailValidation.message);
        return;
      }

      // Validación completa: todas las preguntas deben tener respuesta
      const totalQuestions = state.questions.length;
      const answeredQuestions = Object.keys(responses).length;

      if (answeredQuestions < totalQuestions) {
        alert(`Por favor responde todas las preguntas. Has respondido ${answeredQuestions} de ${totalQuestions} preguntas.`);
        return;
      }

      // Validación adicional: verificar que las respuestas no estén vacías
      const emptyResponses = Object.entries(responses).filter(([, value]) => {
        if (typeof value === 'string') {
          return !value.trim();
        }
        if (typeof value === 'number') {
          return value === 0 || isNaN(value);
        }
        return !value;
      });

      if (emptyResponses.length > 0) {
        alert('Por favor completa todas las respuestas. Algunas preguntas tienen respuestas vacías.');
        return;
      }

      const responsesValidation = validateResponses(responses, totalQuestions);
      if (!responsesValidation.isValid) {
        alert(responsesValidation.message);
        return;
      }

      // Obtener información del dispositivo
      const deviceInfo = isMobile ? 'mobile' : 'desktop';

      const isNewEvaluation = !state.existingEvaluation?.evaluation;

      if (state.existingEvaluation?.evaluation) {
        const existingEval = state.existingEvaluation.evaluation as Record<string, unknown>;
        await updateEvaluationWithJson(
          existingEval.id as string,
          responses,
          {
            name: evaluatorInfo.name,
            email: evaluatorInfo.email,
            additionalInfo: evaluatorInfo.additionalInfo,
          },
          evaluationStartTime,
          deviceInfo
        );
      } else {
        await createEvaluationWithJson(
          {
            team_id: state.team!.id,
            invitation_id: state.invitation!.id,
            evaluator_name: evaluatorInfo.name,
            evaluator_email: evaluatorInfo.email,
            evaluator_role: state.invitation!.role_type,
            evaluator_metadata: {
              additional_info: evaluatorInfo.additionalInfo,
            },
            template_id: state.template!.id,
            project_id: state.project!.id,
          },
          responses,
          evaluationStartTime,
          deviceInfo
        );
      }

      // Actualizar contador de usos solo para nuevas evaluaciones
      if (isNewEvaluation) {
        // Obtener el valor actual más reciente de la base de datos
        const { data: currentInvitation, error: fetchError } = await supabase
          .from('team_invitations')
          .select('current_uses')
          .eq('id', state.invitation!.id)
          .single();

        if (fetchError) {
          console.error('Error al obtener invitación actual:', fetchError);
          return;
        }

        const currentUses = currentInvitation?.current_uses || 0;

        // Actualizar contador de usos
        const { error: updateError } = await supabase
          .from('team_invitations')
          .update({
            current_uses: currentUses + 1,
          })
          .eq('id', state.invitation!.id)
          .select();

        if (updateError) {
          console.error('Error al actualizar contador de usos:', updateError);

          // Intento alternativo usando token único
          const { error: altError } = await supabase
            .from('team_invitations')
            .update({ current_uses: currentUses + 1 })
            .eq('unique_token', token!)
            .select();

          if (altError) {
            console.error('Error en actualización alternativa:', altError);
          } else {
            console.log('Contador actualizado exitosamente (método alternativo)');
          }
        } else {
          console.log('Contador de usos actualizado exitosamente');
        }
      }

      // Completar proceso de evaluación
      setState(prev => ({ ...prev, step: 'complete', existingEvaluation: null }));
      setResponses({});
    } catch (error) {
      console.error('Error al enviar evaluación:', error);
      alert(error instanceof Error ? error.message : 'Error al enviar evaluación');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Token de invitación no proporcionado</Alert>
      </Container>
    );
  }

  if (state.isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{state.error}</Alert>
      </Container>
    );
  }

  const steps = ['Información', 'Evaluación', 'Completado'];
  const activeStep = state.step === 'info' ? 0 : state.step === 'evaluation' || state.step === 'existing-evaluation' ? 1 : 2;

  return (
    <Container maxWidth="md" sx={{ py: 4, px: { xs: 1, md: 4 } }}>
      {/* Header Premium */}
      <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
        <Box
          sx={{
            p: { xs: 3, md: 4 },
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            color: 'white',
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              fontSize: { xs: '0.8rem', md: '2rem' },
            }}
          >
            {state.template?.title || 'Evaluación de Liderazgo'}
          </Typography>

          {state.template?.description && state.step === 'evaluation' && (
            <Typography
              sx={{
                opacity: 0.9,
                mb: 3,
                fontSize: { xs: '0.6rem', md: '1rem' },
                whiteSpace: 'break-spaces',
              }}
            >
              {state.template.description}
            </Typography>
          )}

          {/* <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 1, md: 2 },
              mb: 2,
            }}
          >
            <Chip
              label={`Proyecto: ${state.project?.name}`}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 'medium',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
              }}
            />
            <Chip
              label={`Equipo: ${state.team?.name}`}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 'medium',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
              }}
            />
            <Chip
              label={state.invitation?.role_type === 'leader' ? 'Líder' : 'Colaborador'}
              sx={{
                backgroundColor: state.invitation?.role_type === 'leader' ? 'warning.main' : 'info.main',
                color: 'white',
                fontWeight: 'medium',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
              }}
            />
          </Box> */}

          {/* Progress indicator mejorado */}
          {state.step !== 'loading' && (
            <Box sx={{ mt: 3 }}>
              {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                  Progreso general
                </Typography>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                  {state.step === 'info' ? '25' : state.step === 'existing-evaluation' ? '50' : state.step === 'evaluation' ? '75' : '100'}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={state.step === 'info' ? 25 : state.step === 'existing-evaluation' ? 50 : state.step === 'evaluation' ? 75 : 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: 'white',
                  },
                }}
              /> */}
            </Box>
          )}

          {/* Stepper mejorado */}
          <Stepper
            activeStep={activeStep}
            sx={{
              mt: 3,
              '& .MuiStepLabel-root .Mui-completed': { color: 'white' },
              '& .MuiStepLabel-root .Mui-active': { color: theme.palette.warning.main },
              '& .MuiStepConnector-line': { borderColor: 'rgba(255,255,255,0.5)' },
            }}
            orientation={isMobile ? 'vertical' : 'horizontal'}
          >
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>
                  <Typography color="white" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Paper>

      {/* Contenido principal */}
      <Card elevation={3}>
        <CardContent sx={{ py: { xs: 3, md: 4 }, px: { xs: 1, md: 4 } }}>
          {/* Paso: Información del evaluador */}
          {state.step === 'info' && (
            <Box>
              <Card
                elevation={8}
                sx={{
                  p: 3,
                  mb: 4,
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.1),
                  borderRadius: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Shield color="primary" />
                  <Typography variant="h6" fontWeight="600">
                    Información Protegida
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Estos datos son para evitar que una persona envie un cuestionario 2 veces. Tus respuestas son completamente anónimas y
                  confidenciales. Los resultados se presentan de forma agregada para proteger tu privacidad.
                </Typography>
              </Card>

              <Grid container spacing={3} sx={{ maxWidth: 600, mx: 'auto' }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Nombre completo"
                    value={evaluatorInfo.name}
                    onChange={e => setEvaluatorInfo(prev => ({ ...prev, name: e.target.value }))}
                    required
                    variant="outlined"
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="email"
                    label="Email *"
                    value={evaluatorInfo.email}
                    onChange={e => setEvaluatorInfo(prev => ({ ...prev, email: e.target.value }))}
                    required
                    variant="outlined"
                    error={evaluatorInfo.email.trim() !== '' && !isValidEmail(evaluatorInfo.email)}
                    helperText={
                      evaluatorInfo.email.trim() !== '' && !isValidEmail(evaluatorInfo.email)
                        ? 'Ingresa un email válido (ejemplo: usuario@dominio.com)'
                        : ''
                    }
                  />
                </Grid>

                {/* <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Información adicional (opcional)"
                    value={evaluatorInfo.additionalInfo}
                    onChange={e => setEvaluatorInfo(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    helperText="Puedes agregar cualquier contexto adicional relevante para la evaluación"
                    variant="outlined"
                  />
                </Grid> */}

                <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleEvaluatorInfoSubmit}
                    disabled={!evaluatorInfo.name.trim() || !evaluatorInfo.email.trim() || !isValidEmail(evaluatorInfo.email)}
                    sx={{
                      px: { xs: 4, md: 6 },
                      py: 1.5,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      fontWeight: 'bold',
                      borderRadius: 3,
                      minWidth: { xs: '200px', md: '250px' },
                    }}
                  >
                    Comenzar Evaluación
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Paso: Evaluación existente detectada */}
          {state.step === 'existing-evaluation' && (
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircleIcon
                sx={{
                  fontSize: { xs: 60, md: 80 },
                  color: 'warning.main',
                  mb: 2,
                }}
              />

              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  color: 'warning.main',
                  fontSize: { xs: '1.5rem', md: '2rem' },
                }}
              >
                Evaluación Existente Detectada
              </Typography>

              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  mb: 3,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  px: { xs: 1, md: 0 },
                }}
              >
                Encontramos una evaluación previa con el email: <strong>{evaluatorInfo.email}</strong>
              </Typography>

              <Alert
                severity={state.configuration?.allow_re_evaluation ? 'info' : 'warning'}
                sx={{
                  mb: 4,
                  textAlign: 'left',
                  mx: { xs: 0, md: 2 },
                  maxWidth: 600,
                  marginX: 'auto',
                }}
              >
                <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
                  {state.configuration?.allow_re_evaluation
                    ? 'Este proyecto permite editar evaluaciones. Puedes modificar tus respuestas anteriores.'
                    : 'Este proyecto NO permite editar evaluaciones una vez enviadas.'}
                </Typography>
              </Alert>

              <Grid container spacing={3} sx={{ maxWidth: 400, mx: 'auto' }}>
                <Grid size={{ xs: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                  {state.configuration?.allow_re_evaluation ? (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => setState(prev => ({ ...prev, step: 'evaluation' }))}
                        sx={{
                          px: { xs: 4, md: 6 },
                          py: 1.5,
                          fontSize: { xs: '1rem', md: '1.1rem' },
                          fontWeight: 'bold',
                          borderRadius: 3,
                          width: '100%',
                          maxWidth: '300px',
                        }}
                      >
                        Editar Mi Evaluación
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setState(prev => ({ ...prev, step: 'info', existingEvaluation: null }))}
                        sx={{
                          px: 4,
                          py: 1,
                          width: '100%',
                          maxWidth: '300px',
                        }}
                      >
                        Cambiar Email
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => setState(prev => ({ ...prev, step: 'info', existingEvaluation: null }))}
                      sx={{
                        px: { xs: 4, md: 6 },
                        py: 1.5,
                        fontSize: { xs: '1rem', md: '1.1rem' },
                        fontWeight: 'bold',
                        borderRadius: 3,
                        width: '100%',
                        maxWidth: '300px',
                      }}
                    >
                      Usar Otro Email
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Paso: Evaluación */}
          {state.step === 'evaluation' && (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  gap: 2,
                  mb: 4,
                  flexDirection: { xs: 'column', md: 'row' },
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    color: 'primary.main',
                  }}
                >
                  Cuestionario de Evaluación
                </Typography>
                {state.existingEvaluation?.evaluation && (
                  <Alert
                    severity="info"
                    sx={{
                      flexGrow: 1,
                      fontSize: { xs: '0.875rem', md: '1rem' },
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Editando evaluación existente - Tus respuestas anteriores están precargadas
                    </Typography>
                  </Alert>
                )}
              </Box>

              <Box sx={{ mt: 3 }}>
                {state.questions.map((question, index) => {
                  const config = question.response_config as Record<string, unknown>;
                  const scale = (config?.scale as number) || 5;
                  const minLabel = (config?.min_label as string) || 'Totalmente en desacuerdo';
                  const maxLabel = (config?.max_label as string) || 'Totalmente de acuerdo';
                  const labels = config?.labels as string[] | undefined;

                  return (
                    <Paper
                      key={question.id}
                      elevation={2}
                      sx={{
                        mb: { xs: 2, md: 3 }, // Reducido de 3-4 a 2-3
                        p: { xs: 1.5, md: 2.5 }, // Reducido de 2-3 a 1.5-2.5
                        pt: { xs: 3, md: 2.5 }, // Reducido padding top
                        border: responses[question.id] ? '2px solid' : '1px solid',
                        borderColor: responses[question.id] ? 'success.light' : 'divider',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'visible', // Permitir que el número sobresalga
                        '&:hover': {
                          elevation: 4,
                          borderColor: 'primary.light',
                        },
                      }}
                    >
                      {/* Número de pregunta flotante en móvil */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: { xs: -14, md: 14 }, // Reducido de -16/16 a -14/14
                          left: { xs: 14, md: 14 }, // Reducido de 16 a 14
                          minWidth: { xs: 28, md: 36 }, // Reducido de 32/40 a 28/36
                          height: { xs: 28, md: 36 }, // Reducido de 32/40 a 28/36
                          backgroundColor: 'primary.main',
                          color: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: { xs: '0.8rem', md: '0.95rem' }, // Reducido ligeramente
                          flexShrink: 0,
                          zIndex: 10,
                          boxShadow: { xs: '0 2px 6px rgba(0,0,0,0.12)', md: 'none' }, // Sombra más sutil
                        }}
                      >
                        {index + 1}
                      </Box>

                      {/* Header de pregunta */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: { xs: 0, md: 1.5 }, // Reducido gap en desktop
                          mb: 2, // Reducido de 3 a 2
                          pr: 0,
                          pl: { xs: 0, md: 5 }, // Reducido padding left de 6 a 5
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 'medium',
                            flexGrow: 1,
                            fontSize: { xs: '0.95rem', md: '1.2rem' }, // Ligeramente más pequeño
                            lineHeight: 1.3, // Reducido de 1.4 a 1.3
                            ml: { xs: 0, md: 0 },
                          }}
                        >
                          {state.invitation?.role_type === 'leader' ? question.text_leader : question.text_collaborator}
                        </Typography>
                      </Box>

                      {/* Pregunta tipo Likert */}
                      {question.question_type === 'likert' && (
                        <Box sx={{ mt: 2 }}>
                          {' '}
                          {/* Reducido de 3 a 2 */}
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 'bold',
                              mb: 2, // Reducido de 3 a 2
                              color: 'primary.main',
                              fontSize: { xs: '0.9rem', md: '1rem' }, // Ligeramente más pequeño
                            }}
                          >
                            Escala de Evaluación (1-{scale})
                          </Typography>
                          {/* Etiquetas de extremos */}
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              mb: 2, // Reducido de 3 a 2
                              px: 1,
                              flexDirection: { xs: 'row', sm: 'row' },
                              gap: { xs: 1, sm: 0 },
                            }}
                          >
                            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 'bold',
                                  color: 'error.main',
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                {minLabel}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                (Puntuación: 1)
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 'bold',
                                  color: 'success.main',
                                  fontSize: { xs: '0.75rem', md: '0.875rem' },
                                }}
                              >
                                {maxLabel}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                (Puntuación: {scale})
                              </Typography>
                            </Box>
                          </Box>
                          <RadioGroup
                            value={responses[question.id] || ''}
                            onChange={e => handleResponseChange(question.id, parseInt(e.target.value))}
                          >
                            <Grid
                              container
                              spacing={{ xs: 0.5, md: 2 }}
                              sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'stretch',
                              }}
                            >
                              {Array.from({ length: scale }, (_, i) => i + 1).map((value, index) => {
                                const isSelected = responses[question.id] === value;
                                const intensity = (value - 1) / (scale - 1);

                                return (
                                  <Grid
                                    size={{
                                      xs: scale <= 3 ? 4 : scale <= 5 ? 2.4 : 2,
                                      sm: scale <= 3 ? 4 : scale <= 5 ? 2.4 : 2,
                                      md: 12 / scale,
                                    }}
                                    sx={{ display: 'flex', justifyContent: 'center' }}
                                    key={index}
                                  >
                                    <Paper
                                      elevation={isSelected ? 6 : 2}
                                      sx={{
                                        p: { xs: 0.4, md: 1.2 }, // Más compacto en web
                                        cursor: 'pointer',
                                        backgroundColor: isSelected
                                          ? intensity < 0.3
                                            ? '#ffebee'
                                            : intensity < 0.7
                                            ? '#fff3e0'
                                            : '#e8f5e8'
                                          : 'background.paper',
                                        border: '2px solid',
                                        borderColor: isSelected
                                          ? intensity < 0.3
                                            ? 'error.main'
                                            : intensity < 0.7
                                            ? 'warning.main'
                                            : 'success.main'
                                          : 'divider',
                                        transition: 'all 0.3s ease',
                                        minHeight: { xs: 28, md: 60 }, // Más compacto en web
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                        '&:hover': {
                                          elevation: 4,
                                          transform: 'scale(1.02)',
                                          borderColor:
                                            intensity < 0.3 ? 'error.light' : intensity < 0.7 ? 'warning.light' : 'success.light',
                                        },
                                      }}
                                      onClick={() => handleResponseChange(question.id, value)}
                                    >
                                      <FormControlLabel
                                        value={value}
                                        control={<Radio sx={{ display: 'none' }} />}
                                        label={
                                          <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Box
                                              sx={{
                                                width: { xs: 22, md: 30 }, // Más compacto en web
                                                height: { xs: 22, md: 30 }, // Más compacto en web
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mb: 0.5, // Margen inferior para separar del label
                                                fontSize: { xs: '0.75rem', md: '0.95rem' }, // Más compacto
                                                fontWeight: 'bold',
                                                color: isSelected ? 'black' : 'text.primary',
                                                background: isSelected
                                                  ? intensity < 0.3
                                                    ? 'error.main'
                                                    : intensity < 0.7
                                                    ? 'warning.main'
                                                    : 'success.main'
                                                  : 'grey.400',
                                                boxShadow: isSelected ? `0 3px 10px rgba(0,0,0,0.25)` : `0 2px 6px rgba(0,0,0,0.15)`,
                                              }}
                                            >
                                              {value}
                                            </Box>
                                            {labels && labels[value - 1] && (
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  fontWeight: isSelected ? 'bold' : 'medium',
                                                  color: isSelected ? 'primary.main' : 'text.secondary',
                                                  fontSize: { xs: '0.55rem', md: '0.65rem' }, // Más pequeño y compacto
                                                  display: { xs: 'none', sm: 'block' },
                                                  lineHeight: 1.1, // Líneas más compactas
                                                  textAlign: 'center',
                                                  maxWidth: '100%', // Evitar overflow
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                }}
                                              >
                                                {labels[value - 1]}
                                              </Typography>
                                            )}
                                          </Box>
                                        }
                                        sx={{ margin: 0, width: '100%' }}
                                      />
                                    </Paper>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </RadioGroup>
                          {/* Barra de progreso visual */}
                          {responses[question.id] && (
                            <Box sx={{ mt: 2, px: 1 }}>
                              {' '}
                              {/* Reducido de mt: 3 a mt: 2 */}
                              <LinearProgress
                                variant="determinate"
                                value={((responses[question.id] as number) / scale) * 100}
                                sx={{
                                  height: 6, // Reducido de 8 a 6
                                  borderRadius: 3, // Reducido de 4 a 3
                                  backgroundColor: 'grey.200',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    backgroundColor:
                                      (responses[question.id] as number) < scale * 0.3
                                        ? 'error.main'
                                        : (responses[question.id] as number) < scale * 0.7
                                        ? 'warning.main'
                                        : 'success.main',
                                  },
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  mt: 0.5, // Reducido de 1 a 0.5
                                  display: 'block',
                                  textAlign: 'center',
                                  fontSize: { xs: '0.7rem', md: '0.8rem' }, // Ligeramente más pequeño
                                }}
                              >
                                Seleccionado: {responses[question.id]}/{scale}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Pregunta tipo Text */}
                      {question.question_type === 'text' && (
                        <Box sx={{ mt: 2 }}>
                          {' '}
                          {/* Reducido de 3 a 2 */}
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 'bold', mb: 1.5, color: 'primary.main', fontSize: { xs: '0.9rem', md: '1rem' } }}
                          >
                            {' '}
                            {/* Reducido mb y fontSize */}
                            Respuesta Abierta
                          </Typography>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 1.5, // Reducido de 2 a 1.5
                              backgroundColor: 'background.default',
                              border: '2px dashed',
                              borderColor: responses[question.id] ? 'primary.main' : 'grey.300',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <TextField
                              fullWidth
                              multiline
                              rows={4} // Reducido de 6 a 4 filas
                              value={responses[question.id] || ''}
                              onChange={e => handleResponseChange(question.id, e.target.value)}
                              placeholder="Comparte tus ideas, experiencias o comentarios aquí..."
                              variant="outlined"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: 'white',
                                  '& fieldset': { borderColor: 'transparent' },
                                  '&:hover fieldset': { borderColor: 'primary.light' },
                                  '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 },
                                },
                              }}
                            />
                          </Paper>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 1 }}>
                            {' '}
                            {/* Reducido mt de 2 a 1 */}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontStyle: 'italic', fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                            >
                              {' '}
                              {/* Texto más pequeño */}
                              Tip: Sé específico y proporciona ejemplos cuando sea posible
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                              {(responses[question.id] as string)?.length || 0} caracteres
                            </Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Pregunta tipo Multiple Choice */}
                      {question.question_type === 'multiple_choice' && (
                        <Box sx={{ mt: 2 }}>
                          {' '}
                          {/* Reducido de 3 a 2 */}
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 'bold', mb: 1.5, color: 'primary.main', fontSize: { xs: '0.9rem', md: '1rem' } }}
                          >
                            {' '}
                            {/* Reducido mb y fontSize */}
                            Selección Múltiple
                          </Typography>
                          <RadioGroup
                            value={responses[question.id] || ''}
                            onChange={e => handleResponseChange(question.id, e.target.value)}
                            sx={{ gap: 1 }}
                          >
                            {((config?.options as string[]) || []).map((option, optIndex) => (
                              <Paper
                                key={optIndex}
                                elevation={responses[question.id] === option ? 3 : 1}
                                sx={{
                                  transition: 'all 0.3s ease',
                                  cursor: 'pointer',
                                  border: '2px solid',
                                  borderColor: responses[question.id] === option ? 'primary.main' : 'divider',
                                  backgroundColor: responses[question.id] === option ? 'primary.light' : 'background.paper',
                                  '&:hover': {
                                    borderColor: 'primary.main',
                                    elevation: 2,
                                  },
                                }}
                                onClick={() => handleResponseChange(question.id, option)}
                              >
                                <FormControlLabel
                                  value={option}
                                  control={<Radio sx={{ color: 'primary.main', '&.Mui-checked': { color: 'primary.main' } }} />}
                                  label={
                                    <Typography variant="body1" sx={{ fontWeight: 'medium', py: 1 }}>
                                      {option}
                                    </Typography>
                                  }
                                  sx={{
                                    width: '100%',
                                    margin: 0,
                                    p: 2,
                                    '& .MuiFormControlLabel-label': {
                                      width: '100%',
                                      color: responses[question.id] === option ? 'primary.main' : 'text.primary',
                                    },
                                  }}
                                />
                              </Paper>
                            ))}
                          </RadioGroup>
                        </Box>
                      )}

                      {/* Tipo de pregunta no soportado */}
                      {!['likert', 'text', 'multiple_choice'].includes(question.question_type || '') && (
                        <Box sx={{ mt: 3 }}>
                          <Alert severity="warning" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              Tipo de pregunta no soportado: <strong>{question.question_type}</strong>
                            </Typography>
                          </Alert>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={responses[question.id] || ''}
                            onChange={e => handleResponseChange(question.id, e.target.value)}
                            placeholder="Ingresa tu respuesta aquí..."
                            variant="outlined"
                            helperText={`Tipo de pregunta: ${question.question_type} - Usando campo de texto como fallback`}
                          />
                        </Box>
                      )}

                      {/* Indicador de respuesta completada */}
                      {/* {responses[question.id] && (
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon color="success" fontSize="small" />
                          <Typography variant="caption" color="success.main" sx={{ fontWeight: 'medium' }}>
                            Respuesta guardada
                          </Typography>
                        </Box>
                      )} */}
                    </Paper>
                  );
                })}

                {/* Sección de envío */}
                <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mt: 4, backgroundColor: 'background.default' }}>
                  <Grid container spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                        Progreso de la evaluación
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
                      <Chip
                        label={`${Object.keys(responses).length}/${state.questions.length} respondidas`}
                        color={Object.keys(responses).length === state.questions.length ? 'success' : 'warning'}
                        variant="filled"
                      />
                    </Grid>
                  </Grid>

                  <LinearProgress
                    variant="determinate"
                    value={(Object.keys(responses).length / state.questions.length) * 100}
                    sx={{ height: 8, borderRadius: 4, mb: 3 }}
                  />

                  {/* Alerta para respuestas incompletas */}
                  {Object.keys(responses).length > 0 && Object.keys(responses).length < state.questions.length && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                      <Typography variant="body2">
                        <strong>Atención:</strong> Te faltan {state.questions.length - Object.keys(responses).length} preguntas por
                        responder. Debes completar todas las preguntas antes de enviar la evaluación.
                      </Typography>
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={handleSubmitEvaluation}
                      disabled={isSubmitting || Object.keys(responses).length < state.questions.length}
                      size="large"
                      sx={{
                        px: { xs: 6, md: 8 },
                        py: 2,
                        fontSize: { xs: '1rem', md: '1.2rem' },
                        fontWeight: 'bold',
                        borderRadius: 3,
                        minWidth: { xs: '200px', md: '250px' },
                        opacity: Object.keys(responses).length < state.questions.length ? 0.7 : 1,
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <CircularProgress size={24} sx={{ mr: 1 }} />
                          {state.existingEvaluation?.evaluation ? 'Actualizando...' : 'Enviando...'}
                        </>
                      ) : Object.keys(responses).length < state.questions.length ? (
                        `Completa todas las preguntas (${Object.keys(responses).length}/${state.questions.length})`
                      ) : (
                        <>{state.existingEvaluation?.evaluation ? 'Actualizar Evaluación' : 'Enviar Evaluación'}</>
                      )}
                    </Button>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}

          {/* Paso: Evaluación completada */}
          {state.step === 'complete' && (
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: { xs: 80, md: 120 }, color: 'success.main', mb: 3 }} />
              <Typography
                variant="h3"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  fontSize: { xs: '1.8rem', md: '2.5rem' },
                }}
              >
                ¡Evaluación Completada!
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                }}
              >
                Gracias por tu participación, <strong>{evaluatorInfo.name}</strong>
              </Typography>

              <Box
                sx={{
                  backgroundColor: 'success.light',
                  borderRadius: 2,
                  p: { xs: 2, md: 3 },
                  mb: 4,
                  maxWidth: 600,
                  mx: 'auto',
                }}
              >
                <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', md: '1.1rem' } }}>
                  Tu evaluación ha sido registrada exitosamente. Los resultados serán procesados y estarán disponibles para el análisis del
                  proyecto.
                </Typography>
              </Box>

              {/* <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                <Chip
                  label={`Evaluado como: ${state.invitation?.role_type === 'leader' ? 'Líder' : 'Colaborador'}`}
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' }, py: 2 }}
                />
                <Chip label={`Proyecto: ${state.project?.name}`} color="default" variant="outlined" sx={{ fontWeight: 'medium' }} />
              </Box> */}
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
