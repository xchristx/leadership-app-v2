// ============================================================================
// PÁGINA DE EVALUACIÓN POR TOKEN - VERSIÓN MEJORADA
// ============================================================================
// Página pública para evaluaciones con configuraciones del proyecto
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, Alert, CircularProgress, Container, useMediaQuery } from '@mui/material';

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
import { EvaluationHeader, EvaluatorInfoStep, ExistingEvaluationStep, QuestionStep, CompletionStep } from '../components/Evaluation';
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

      // Determinar si se debe pedir info personal
      const isLeader = invitation.role_type === 'leader';
      const mustAskPersonalInfo = isLeader || configuration?.require_evaluator_info;
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
        step: mustAskPersonalInfo ? 'info' : 'evaluation',
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
    // Determinar si es líder o colaborador
    const isLeader = state.invitation?.role_type === 'leader';
    const mustAskPersonalInfo = isLeader || state.configuration?.require_evaluator_info;
    if (!mustAskPersonalInfo) {
      // Colaborador anónimo: saltar a evaluación
      setEvaluatorInfo({ name: 'Anónimo', email: `anonimo${Date.now()}@dominio.com`, additionalInfo: '' });
      setState(prev => ({ ...prev, step: 'evaluation', existingEvaluation: null }));
      return;
    }

    // Si es líder o se requiere info, validar campos
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

      // Validación de email solo si corresponde
      const isLeaderSubmit = state.invitation?.role_type === 'leader';
      const mustAskPersonalInfoSubmit = isLeaderSubmit || state.configuration?.require_evaluator_info;
      if (mustAskPersonalInfoSubmit) {
        if (!isValidEmail(evaluatorInfo.email)) {
          alert('Por favor ingresa un email válido antes de enviar la evaluación');
          return;
        }
        const emailValidation = validateEmail(evaluatorInfo.email);
        if (!emailValidation.isValid) {
          alert(emailValidation.message);
          return;
        }
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

      // Determinar datos a guardar según el rol y configuración
      const isLeaderSave = state.invitation?.role_type === 'leader';
      const nameToSave = isLeaderSave ? evaluatorInfo.name : state.configuration?.require_evaluator_info ? evaluatorInfo.name : 'Anónimo';
      const emailToSave = isLeaderSave
        ? evaluatorInfo.email
        : state.configuration?.require_evaluator_info
        ? evaluatorInfo.email
        : `anonimo${Date.now()}@dominio.com`;

      if (state.existingEvaluation?.evaluation) {
        const existingEval = state.existingEvaluation.evaluation as Record<string, unknown>;
        await updateEvaluationWithJson(
          existingEval.id as string,
          responses,
          {
            name: nameToSave,
            email: emailToSave,
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
            evaluator_name: nameToSave,
            evaluator_email: emailToSave,
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
  const renderCurrentStep = () => {
    switch (state.step) {
      case 'info':
        return (
          <EvaluatorInfoStep
            evaluatorInfo={evaluatorInfo}
            onEvaluatorInfoChange={setEvaluatorInfo}
            onSubmit={handleEvaluatorInfoSubmit}
            isLeader={state.invitation?.role_type === 'leader'}
            requireEvaluatorInfo={!!state.configuration?.require_evaluator_info}
          />
        );

      case 'existing-evaluation':
        return (
          <ExistingEvaluationStep
            email={evaluatorInfo.email}
            allowReEvaluation={!!state.configuration?.allow_re_evaluation}
            onEditEvaluation={() => setState(prev => ({ ...prev, step: 'evaluation' }))}
            onChangeEmail={() => setState(prev => ({ ...prev, step: 'info', existingEvaluation: null }))}
          />
        );

      case 'evaluation':
        return (
          <QuestionStep
            questions={state.questions}
            responses={responses}
            onResponseChange={handleResponseChange}
            onSubmit={handleSubmitEvaluation}
            isSubmitting={isSubmitting}
            existingEvaluation={state.existingEvaluation}
            invitationRoleType={state.invitation?.role_type}
          />
        );

      case 'complete':
        return <CompletionStep evaluatorName={evaluatorInfo.name} />;

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, px: { xs: 1, md: 4 } }}>
      {/* Header Premium */}
      <EvaluationHeader
        templateTitle={state.template?.title || 'Evaluación de Liderazgo'}
        team={state.team ?? undefined}
        templateDescription={state.template?.description}
        showDescription={state.step === 'evaluation'}
        activeStep={activeStep}
        steps={steps}
      />

      {/* Contenido principal */}
      <Card elevation={3}>
        <CardContent sx={{ py: { xs: 3, md: 4 }, px: { xs: 1, md: 4 } }}>{renderCurrentStep()}</CardContent>
      </Card>
    </Container>
  );
}
