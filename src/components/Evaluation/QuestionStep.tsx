import { Box, Typography, Alert } from '@mui/material';
import { QuestionCard } from './QuestionCard';
import { ProgressSection } from './ProgressSection';
import type { Question } from '../../types';

interface QuestionStepProps {
  questions: Question[];
  responses: Record<string, string | number>;
  onResponseChange: (questionId: string, value: string | number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  existingEvaluation?: {
    evaluation: object | null;
    responses: object[];
    canEdit: boolean;
  } | null;
  invitationRoleType?: string;
}

export function QuestionStep({
  questions,
  responses,
  onResponseChange,
  onSubmit,
  isSubmitting,
  existingEvaluation,
  invitationRoleType,
}: QuestionStepProps) {
  return (
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
        {existingEvaluation?.evaluation && (
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
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            response={responses[question.id]}
            onResponseChange={onResponseChange}
            invitationRoleType={invitationRoleType}
          />
        ))}

        <ProgressSection
          currentResponses={Object.keys(responses).length}
          totalQuestions={questions.length}
          isSubmitting={isSubmitting}
          hasExistingEvaluation={!!existingEvaluation?.evaluation}
          onSubmit={onSubmit}
        />
      </Box>
    </Box>
  );
}
