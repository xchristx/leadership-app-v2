// ============================================================================
// PÁGINA DE EVALUACIÓN POR TOKEN
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
  Checkbox,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';

import { supabase } from '../lib/supabase';
import type { TeamInvitation, Team, Project, ProjectConfiguration, Question } from '../types';

interface EvaluationPageState {
  invitation: TeamInvitation | null;
  team: Team | null;
  project: Project | null;
  configuration: ProjectConfiguration | null;
  questions: Question[];
  isLoading: boolean;
  error: string | null;
  step: 'loading' | 'info' | 'evaluation' | 'complete';
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
    questions: [],
    isLoading: true,
    error: null,
    step: 'loading',
  });

  const [evaluatorInfo, setEvaluatorInfo] = useState<EvaluatorInfo>({
    name: '',
    email: '',
    additionalInfo: '',
  });

  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Verificar si la invitación está activa
      if (!invitation.is_active) {
        throw new Error('Esta invitación ha sido desactivada');
      }

      // Verificar fecha de expiración
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        throw new Error('Esta invitación ha expirado');
      }

      // Verificar límite de usos
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
        .select(
          `
          *,
          project_configurations(*)
        `
        )
        .eq('id', team.project_id)
        .single();

      if (projectError || !project) {
        throw new Error('Proyecto no encontrado');
      }

      // Verificar si el proyecto está activo
      if (project.status !== 'active') {
        throw new Error('Este proyecto no está disponible para evaluaciones');
      }

      // 4. Obtener preguntas de la plantilla
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

      // Verificar deadline si está configurado
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
        questions: (questions || []) as Question[],
        isLoading: false,
        error: null,
        step: configuration?.require_evaluator_info ? 'info' : 'evaluation',
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

  const handleEvaluatorInfoSubmit = () => {
    if (!state.configuration?.require_evaluator_info) {
      setState(prev => ({ ...prev, step: 'evaluation' }));
      return;
    }

    // Validar información requerida
    if (!evaluatorInfo.name.trim() || !evaluatorInfo.email.trim()) {
      alert('Por favor completa tu nombre y email');
      return;
    }

    setState(prev => ({ ...prev, step: 'evaluation' }));
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

      // Validar que haya al menos una respuesta
      if (Object.keys(responses).length === 0) {
        alert('Por favor responde al menos una pregunta');
        return;
      }

      // Crear evaluación
      const { data: evaluation, error: evaluationError } = await supabase
        .from('evaluations')
        .insert([
          {
            team_id: state.team!.id,
            invitation_id: state.invitation!.id,
            evaluator_name: evaluatorInfo.name,
            evaluator_email: evaluatorInfo.email,
            evaluator_role: state.invitation!.role_type,
            is_complete: true,
            completion_percentage: 100,
            completed_at: new Date().toISOString(),
            evaluator_metadata: {
              additional_info: evaluatorInfo.additionalInfo,
            },
          },
        ])
        .select()
        .single();

      if (evaluationError) {
        throw new Error('Error al crear evaluación');
      }

      // Crear respuestas
      const responseData = Object.entries(responses).map(([questionId, value]) => ({
        evaluation_id: evaluation.id,
        question_id: questionId,
        response_value: typeof value === 'number' ? value : null,
        response_text: typeof value === 'string' ? value : null,
        response_data: typeof value === 'object' ? value : null,
      }));

      const { error: responsesError } = await supabase.from('evaluation_responses').insert(responseData);

      if (responsesError) {
        throw new Error('Error al guardar respuestas');
      }

      // Actualizar contador de usos de la invitación
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({
          current_uses: (state.invitation!.current_uses || 0) + 1,
        })
        .eq('id', state.invitation!.id);

      if (updateError) {
        console.warn('Error al actualizar contador de usos:', updateError);
      }

      setState(prev => ({ ...prev, step: 'complete' }));
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
  const activeStep = state.step === 'info' ? 0 : state.step === 'evaluation' ? 1 : 2;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Evaluación de Liderazgo
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Equipo: {state.team?.name} | Proyecto: {state.project?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rol: {state.invitation?.role_type === 'leader' ? 'Líder' : 'Colaborador'}
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Contenido según el step */}
          {state.step === 'info' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Información del Evaluador
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                <TextField
                  fullWidth
                  label="Nombre completo *"
                  value={evaluatorInfo.name}
                  onChange={e => setEvaluatorInfo(prev => ({ ...prev, name: e.target.value }))}
                  required
                />

                <TextField
                  fullWidth
                  type="email"
                  label="Email *"
                  value={evaluatorInfo.email}
                  onChange={e => setEvaluatorInfo(prev => ({ ...prev, email: e.target.value }))}
                  required
                />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Información adicional (opcional)"
                  value={evaluatorInfo.additionalInfo}
                  onChange={e => setEvaluatorInfo(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  helperText="Puedes agregar cualquier contexto adicional relevante"
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleEvaluatorInfoSubmit}
                    disabled={!evaluatorInfo.name.trim() || !evaluatorInfo.email.trim()}
                  >
                    Continuar
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {state.step === 'evaluation' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Cuestionario de Evaluación
              </Typography>

              <Box sx={{ mt: 3 }}>
                {state.questions.map((question, index) => (
                  <Card key={question.id} sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {index + 1}. {state.invitation?.role_type === 'leader' ? question.text_leader : question.text_collaborator}
                      </Typography>

                      {question.question_type === 'likert' && (
                        <Box sx={{ mt: 2 }}>
                          {[1, 2, 3, 4, 5].map(value => (
                            <FormControlLabel
                              key={value}
                              control={
                                <Checkbox
                                  checked={responses[question.id] === value}
                                  onChange={() => handleResponseChange(question.id, value)}
                                />
                              }
                              label={question.response_config.labels?.[value - 1] || `${value}`}
                              sx={{ display: 'block' }}
                            />
                          ))}
                        </Box>
                      )}

                      {question.question_type === 'text' && (
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          value={responses[question.id] || ''}
                          onChange={e => handleResponseChange(question.id, e.target.value)}
                          sx={{ mt: 2 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                  <Button variant="contained" onClick={handleSubmitEvaluation} disabled={isSubmitting} size="large">
                    {isSubmitting ? 'Enviando...' : 'Enviar Evaluación'}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {state.step === 'complete' && (
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                ¡Evaluación Completada!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Gracias por tu participación. Tu evaluación ha sido enviada exitosamente.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
