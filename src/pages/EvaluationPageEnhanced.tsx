// ============================================================================
// PÁGINA DE EVALUACIÓN MEJORADA - CON NAVEGACIÓN POR PASOS
// ============================================================================
// Versión premium con navegación sofisticada y validaciones avanzadas
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  IconButton,
  Tooltip,
  Badge,
  Grid,
  ButtonGroup,
  Fade,
  Zoom,
} from '@mui/material';
import { NavigateNext, NavigateBefore, CheckCircle, Error, QuestionMark } from '@mui/icons-material';

// Tipos e interfaces
interface Question {
  id: string;
  question_text: string;
  question_type: string;
  response_config: Record<string, unknown>;
  order_index: number;
  is_required: boolean;
}

interface EvaluationState {
  currentStep: number;
  totalSteps: number;
  evaluatorName: string;
  evaluatorEmail: string;
  evaluatorInfo: string;
  responses: Record<string, string | number>;
  isLoading: boolean;
  error: string | null;
  questions: Question[];
  questionsPerPage: number;
}

const QUESTIONS_PER_PAGE = 3;

export default function EvaluationPageEnhanced() {
  // Estado principal
  const [state, setState] = useState<EvaluationState>({
    currentStep: 0,
    totalSteps: 1,
    evaluatorName: '',
    evaluatorEmail: '',
    evaluatorInfo: '',
    responses: {},
    isLoading: true,
    error: null,
    questions: [],
    questionsPerPage: QUESTIONS_PER_PAGE,
  });

  // Preguntas paginadas
  const paginatedQuestions = useCallback(() => {
    const chunks: Question[][] = [];
    for (let i = 0; i < state.questions.length; i += state.questionsPerPage) {
      chunks.push(state.questions.slice(i, i + state.questionsPerPage));
    }
    return chunks;
  }, [state.questions, state.questionsPerPage]);

  const questionPages = paginatedQuestions();
  const currentQuestions = useMemo(() => questionPages[state.currentStep - 1] || [], [questionPages, state.currentStep]);

  // Validación sofisticada del paso actual
  const getStepValidation = useCallback(() => {
    if (state.currentStep === 0) {
      // Validación de información del evaluador
      const nameValid = state.evaluatorName.trim().length >= 2;
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.evaluatorEmail);

      return {
        isValid: nameValid && emailValid,
        errors: [!nameValid && 'El nombre debe tener al menos 2 caracteres', !emailValid && 'El email no tiene un formato válido'].filter(
          Boolean
        ) as string[],
        warnings: [
          state.evaluatorName.trim().length > 50 && 'El nombre es muy largo',
          state.evaluatorInfo.length > 500 && 'La información adicional es muy extensa',
        ].filter(Boolean) as string[],
      };
    }

    // Validación de preguntas
    const invalidQuestions: { question: string; issue: string }[] = [];
    const warnings: string[] = [];

    currentQuestions.forEach(question => {
      const response = state.responses[question.id];
      const isEmpty = response === undefined || response === null || response === '';

      if (question.is_required && isEmpty) {
        invalidQuestions.push({
          question: question.question_text.substring(0, 50) + '...',
          issue: 'Respuesta requerida',
        });
      }

      // Validaciones específicas por tipo
      if (!isEmpty) {
        if (question.question_type === 'text') {
          const textResponse = response as string;
          if (textResponse.length < 10) {
            warnings.push(`Respuesta muy breve para: "${question.question_text.substring(0, 30)}..."`);
          }
        }

        if (question.question_type === 'likert') {
          const numResponse = Number(response);
          const config = question.response_config;
          const scale = (config?.scale as number) || 5;

          if (numResponse < 1 || numResponse > scale) {
            invalidQuestions.push({
              question: question.question_text.substring(0, 50) + '...',
              issue: `Valor debe estar entre 1 y ${scale}`,
            });
          }
        }
      }
    });

    return {
      isValid: invalidQuestions.length === 0,
      errors: invalidQuestions.map(iq => `${iq.issue}: ${iq.question}`),
      warnings,
    };
  }, [state.currentStep, state.evaluatorName, state.evaluatorEmail, state.evaluatorInfo, currentQuestions, state.responses]);

  // Navegación entre pasos
  const handleNext = useCallback(() => {
    const validation = getStepValidation();

    if (!validation.isValid) {
      setState(prev => ({
        ...prev,
        error: `Por favor corrige los siguientes errores:\n• ${validation.errors.join('\n• ')}`,
      }));
      return;
    }

    if (state.currentStep < state.totalSteps - 1) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        error: null,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.currentStep, state.totalSteps, getStepValidation]);

  const handleBack = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
        error: null,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.currentStep]);

  // Ir directamente a un paso específico
  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex === state.currentStep) return;

      // No permitir avanzar más allá del paso validado
      if (stepIndex > state.currentStep) {
        const validation = getStepValidation();
        if (!validation.isValid) {
          setState(prev => ({
            ...prev,
            error: 'Completa el paso actual antes de continuar',
          }));
          return;
        }
      }

      setState(prev => ({
        ...prev,
        currentStep: stepIndex,
        error: null,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [state.currentStep, getStepValidation]
  );

  // Manejo de respuestas
  const handleResponseChange = useCallback((questionId: string, value: string | number) => {
    setState(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [questionId]: value,
      },
    }));
  }, []);

  // Progreso de evaluación
  const getProgress = useCallback(() => {
    const totalQuestions = state.questions.length;
    const answeredQuestions = Object.keys(state.responses).length;
    const infoProgress = state.evaluatorName && state.evaluatorEmail ? 1 : 0;

    const totalSteps = totalQuestions + 1; // +1 para información del evaluador
    const completedSteps = answeredQuestions + infoProgress;

    return Math.round((completedSteps / totalSteps) * 100);
  }, [state.questions.length, state.responses, state.evaluatorName, state.evaluatorEmail]);

  // Renderizado de diferentes tipos de preguntas
  const renderQuestion = (question: Question) => {
    const config = question.response_config;
    const currentResponse = state.responses[question.id];

    if (question.question_type === 'likert') {
      const scale = (config?.scale as number) || 5;
      const minLabel = (config?.min_label as string) || 'Totalmente en desacuerdo';
      const maxLabel = (config?.max_label as string) || 'Totalmente de acuerdo';
      const labels = config?.labels as string[];

      return (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
            📊 Escala Likert (1-{scale})
          </Typography>

          {/* Etiquetas de extremos */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, px: 1 }}>
            <Typography variant="caption" color="error.main" sx={{ fontWeight: 'medium' }}>
              👎 {minLabel}
            </Typography>
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 'medium' }}>
              👍 {maxLabel}
            </Typography>
          </Box>

          {/* Opciones de respuesta en grid responsive */}
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {Array.from({ length: scale }, (_, index) => {
              const value = index + 1;
              const isSelected = currentResponse === value;
              const intensity = (value - 1) / (scale - 1); // 0 to 1

              return (
                <Grid size={{ xs: 12, md: Math.floor(12 / scale) }} key={value}>
                  <Zoom in timeout={300 + index * 100}>
                    <Paper
                      elevation={isSelected ? 8 : 2}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: isSelected
                          ? `linear-gradient(135deg, ${intensity < 0.3 ? '#ffebee' : intensity < 0.7 ? '#fff3e0' : '#e8f5e8'}, ${
                              intensity < 0.3 ? '#ffcdd2' : intensity < 0.7 ? '#ffe0b2' : '#c8e6c9'
                            })`
                          : 'background.paper',
                        border: '2px solid',
                        borderColor: isSelected
                          ? intensity < 0.3
                            ? 'error.main'
                            : intensity < 0.7
                            ? 'warning.main'
                            : 'success.main'
                          : 'divider',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          borderColor: intensity < 0.3 ? 'error.light' : intensity < 0.7 ? 'warning.light' : 'success.light',
                          boxShadow: `0 4px 20px rgba(0,0,0,0.15)`,
                        },
                      }}
                      onClick={() => handleResponseChange(question.id, value)}
                    >
                      {/* Círculo con número */}
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          color: 'white',
                          background: isSelected
                            ? intensity < 0.3
                              ? 'error.main'
                              : intensity < 0.7
                              ? 'warning.main'
                              : 'success.main'
                            : 'grey.400',
                          boxShadow: isSelected ? `0 4px 12px rgba(0,0,0,0.3)` : `0 2px 8px rgba(0,0,0,0.2)`,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {value}
                      </Box>

                      {/* Etiqueta personalizada si existe */}
                      {labels && labels[index] && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: isSelected ? 'bold' : 'medium',
                            color: isSelected ? 'primary.main' : 'text.secondary',
                          }}
                        >
                          {labels[index]}
                        </Typography>
                      )}

                      {/* Emoji para valores extremos */}
                      {value === 1 && <Typography sx={{ fontSize: '1.5rem', mt: 0.5 }}>😞</Typography>}
                      {value === scale && <Typography sx={{ fontSize: '1.5rem', mt: 0.5 }}>😊</Typography>}
                    </Paper>
                  </Zoom>
                </Grid>
              );
            })}
          </Grid>

          {/* Barra de progreso visual */}
          {currentResponse && (
            <Fade in timeout={500}>
              <Box sx={{ mt: 2, px: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={((currentResponse as number) / scale) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      backgroundColor:
                        (currentResponse as number) < scale * 0.3
                          ? 'error.main'
                          : (currentResponse as number) < scale * 0.7
                          ? 'warning.main'
                          : 'success.main',
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  Seleccionado: {currentResponse}/{scale}
                </Typography>
              </Box>
            </Fade>
          )}
        </Box>
      );
    }

    if (question.question_type === 'text') {
      return (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
            ✍️ Respuesta Abierta
          </Typography>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              backgroundColor: 'background.default',
              border: '2px dashed',
              borderColor: currentResponse ? 'primary.main' : 'grey.300',
              transition: 'all 0.3s ease',
            }}
          >
            <TextField
              fullWidth
              multiline
              rows={6}
              value={currentResponse || ''}
              onChange={e => handleResponseChange(question.id, e.target.value)}
              placeholder="💭 Comparte tus ideas, experiencias o comentarios aquí..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: 'primary.light' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 },
                },
                '& .MuiInputBase-input': {
                  fontSize: '1rem',
                  lineHeight: 1.6,
                },
              }}
            />
          </Paper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, px: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              💡 Tip: Sé específico y proporciona ejemplos cuando sea posible
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(currentResponse as string)?.length || 0} caracteres
            </Typography>
          </Box>
        </Box>
      );
    }

    if (question.question_type === 'multiple_choice') {
      const options = (config?.options as string[]) || [];

      return (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
            🎯 Selección Múltiple
          </Typography>
          <RadioGroup value={currentResponse || ''} onChange={e => handleResponseChange(question.id, e.target.value)} sx={{ gap: 1 }}>
            {options.map((option, index) => (
              <Paper
                key={index}
                elevation={currentResponse === option ? 3 : 1}
                sx={{
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: currentResponse === option ? 'primary.main' : 'divider',
                  backgroundColor: currentResponse === option ? 'primary.light' : 'background.paper',
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
                      color: currentResponse === option ? 'primary.main' : 'text.primary',
                    },
                  }}
                />
              </Paper>
            ))}
          </RadioGroup>
        </Box>
      );
    }

    // Tipo de pregunta no soportado
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            ⚠️ Tipo de pregunta no soportado: <strong>{question.question_type}</strong>
          </Typography>
        </Alert>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={currentResponse || ''}
          onChange={e => handleResponseChange(question.id, e.target.value)}
          placeholder="Ingresa tu respuesta aquí..."
          variant="outlined"
          helperText={`Tipo de pregunta: ${question.question_type} - Usando campo de texto como fallback`}
        />
      </Box>
    );
  };

  // Simulación de carga de datos (reemplazar con llamada real)
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      const mockQuestions: Question[] = [
        {
          id: '1',
          question_text: '¿Qué tan efectivamente comunica el líder la visión del equipo?',
          question_type: 'likert',
          response_config: {
            scale: 5,
            min_label: 'Muy inefectivo',
            max_label: 'Muy efectivo',
          },
          order_index: 1,
          is_required: true,
        },
        {
          id: '2',
          question_text: '¿Cómo describirías el estilo de liderazgo de tu líder?',
          question_type: 'text',
          response_config: {},
          order_index: 2,
          is_required: true,
        },
        {
          id: '3',
          question_text: '¿Cuál es el mayor fortaleza del liderazgo que has observado?',
          question_type: 'multiple_choice',
          response_config: {
            options: [
              'Comunicación clara y efectiva',
              'Toma de decisiones estratégicas',
              'Inspiración y motivación del equipo',
              'Gestión de conflictos',
              'Desarrollo del talento',
            ],
          },
          order_index: 3,
          is_required: true,
        },
        {
          id: '4',
          question_text: '¿El líder proporciona retroalimentación constructiva regularmente?',
          question_type: 'likert',
          response_config: {
            scale: 7,
            min_label: 'Nunca',
            max_label: 'Siempre',
            labels: ['Nunca', 'Casi nunca', 'Pocas veces', 'A veces', 'Frecuentemente', 'Casi siempre', 'Siempre'],
          },
          order_index: 4,
          is_required: true,
        },
        {
          id: '5',
          question_text: '¿Qué recomendaciones darías para mejorar el liderazgo?',
          question_type: 'text',
          response_config: {},
          order_index: 5,
          is_required: false,
        },
      ];

      const totalSteps = Math.ceil(mockQuestions.length / QUESTIONS_PER_PAGE) + 1; // +1 para info step

      setState(prev => ({
        ...prev,
        questions: mockQuestions,
        totalSteps,
        isLoading: false,
      }));
    }, 1500);
  }, []);

  if (state.isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Cargando evaluación...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  const validation = getStepValidation();
  const progress = getProgress();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header con progreso */}
      <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
        <Box sx={{ p: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            🎯 Evaluación de Liderazgo
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
            Evaluación integral para el desarrollo del liderazgo efectivo
          </Typography>

          {/* Progreso general */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Progreso general</Typography>
              <Typography variant="body2">{progress}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: 'white',
                },
              }}
            />
          </Box>

          {/* Stepper mejorado */}
          <Stepper
            activeStep={state.currentStep}
            sx={{
              mt: 3,
              '& .MuiStepLabel-root .Mui-completed': { color: 'white' },
              '& .MuiStepLabel-root .Mui-active': { color: 'yellow' },
              '& .MuiStepConnector-line': { borderColor: 'rgba(255,255,255,0.5)' },
            }}
          >
            <Step>
              <StepLabel>
                <Typography color="white">Información</Typography>
              </StepLabel>
            </Step>
            {questionPages.map((_, index) => (
              <Step key={index}>
                <StepLabel>
                  <Typography color="white">
                    Preguntas {index * QUESTIONS_PER_PAGE + 1}-{Math.min((index + 1) * QUESTIONS_PER_PAGE, state.questions.length)}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Paper>

      {/* Contenido principal */}
      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          {/* Alertas de validación */}
          {state.error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {state.error}
              </Typography>
            </Alert>
          )}

          {validation.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Advertencias:
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </Typography>
            </Alert>
          )}

          {/* Paso 0: Información del evaluador */}
          {state.currentStep === 0 && (
            <Fade in timeout={500}>
              <Box>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 4 }}>
                  👤 Información del Evaluador
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Nombre completo"
                      value={state.evaluatorName}
                      onChange={e => setState(prev => ({ ...prev, evaluatorName: e.target.value }))}
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>👤</Typography>,
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email"
                      value={state.evaluatorEmail}
                      onChange={e => setState(prev => ({ ...prev, evaluatorEmail: e.target.value }))}
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>📧</Typography>,
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Información adicional (opcional)"
                      value={state.evaluatorInfo}
                      onChange={e => setState(prev => ({ ...prev, evaluatorInfo: e.target.value }))}
                      helperText="Puedes agregar contexto adicional relevante"
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1, alignSelf: 'flex-start', mt: 1 }}>📝</Typography>,
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Fade>
          )}

          {/* Pasos de preguntas */}
          {state.currentStep > 0 && state.currentStep <= questionPages.length && (
            <Fade in timeout={500}>
              <Box>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 4 }}>
                  📋 Preguntas {(state.currentStep - 1) * QUESTIONS_PER_PAGE + 1} -{' '}
                  {Math.min(state.currentStep * QUESTIONS_PER_PAGE, state.questions.length)}
                </Typography>

                {currentQuestions.map((question, index) => (
                  <Paper
                    key={question.id}
                    elevation={2}
                    sx={{
                      p: 4,
                      mb: 3,
                      border: '1px solid',
                      borderColor: state.responses[question.id] ? 'success.light' : 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                      <Badge
                        badgeContent={
                          state.responses[question.id] ? <CheckCircle sx={{ fontSize: 16 }} /> : <QuestionMark sx={{ fontSize: 16 }} />
                        }
                        color={state.responses[question.id] ? 'success' : 'warning'}
                        sx={{ mr: 2 }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: 'primary.main',
                            color: 'white',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                          }}
                        >
                          {(state.currentStep - 1) * QUESTIONS_PER_PAGE + index + 1}
                        </Box>
                      </Badge>

                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {question.question_text}
                        </Typography>
                        {question.is_required && <Chip label="Requerida" size="small" color="error" variant="outlined" sx={{ mb: 2 }} />}
                      </Box>
                    </Box>

                    {renderQuestion(question)}
                  </Paper>
                ))}
              </Box>
            </Fade>
          )}

          {/* Navegación */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 4,
              pt: 3,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={state.currentStep === 0}
              startIcon={<NavigateBefore />}
              size="large"
              sx={{ minWidth: 120 }}
            >
              Anterior
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Indicadores de pasos */}
              <ButtonGroup variant="outlined" size="small">
                {Array.from({ length: state.totalSteps }, (_, index) => (
                  <Tooltip
                    key={index}
                    title={
                      index === 0
                        ? 'Información'
                        : `Preguntas ${(index - 1) * QUESTIONS_PER_PAGE + 1}-${Math.min(
                            index * QUESTIONS_PER_PAGE,
                            state.questions.length
                          )}`
                    }
                  >
                    <Button
                      onClick={() => goToStep(index)}
                      variant={index === state.currentStep ? 'contained' : 'outlined'}
                      sx={{ minWidth: 40 }}
                    >
                      {index + 1}
                    </Button>
                  </Tooltip>
                ))}
              </ButtonGroup>

              {/* Estado de validación */}
              <Tooltip title={validation.isValid ? 'Paso válido' : 'Faltan campos por completar'}>
                <IconButton color={validation.isValid ? 'success' : 'error'}>{validation.isValid ? <CheckCircle /> : <Error />}</IconButton>
              </Tooltip>
            </Box>

            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!validation.isValid || state.currentStep === state.totalSteps - 1}
              endIcon={<NavigateNext />}
              size="large"
              sx={{ minWidth: 120 }}
            >
              {state.currentStep === state.totalSteps - 1 ? 'Finalizar' : 'Siguiente'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
