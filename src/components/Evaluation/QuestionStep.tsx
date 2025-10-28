import { Box, Typography, Alert, Button, Stack, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useState } from 'react';
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
  const isMobile = useMediaQuery('(max-width:600px)');
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(questions.length / PAGE_SIZE));
  const theme = useTheme();
  const gradient = `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`;
  const gradientHover = `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`;

  const [isFading, setIsFading] = useState(false);
  const ANIM_DURATION = 180;

  const animatedNext = () => {
    if (isFading || page >= totalPages - 1) return;
    setIsFading(true);
    setTimeout(() => {
      setPage((p: number) => Math.min(totalPages - 1, p + 1));
      const f = () => (isMobile ? window.scrollTo(0, 700) : window.scrollTo(0, 500));
      f();
      // small delay to allow DOM update then fade in
      setTimeout(() => setIsFading(false), Math.max(20, ANIM_DURATION / 4));
    }, ANIM_DURATION);
  };

  const animatedPrev = () => {
    if (isFading || page === 0) return;
    setIsFading(true);
    setTimeout(() => {
      setPage((p: number) => Math.max(0, p - 1));
      setTimeout(() => setIsFading(false), Math.max(20, ANIM_DURATION / 4));
    }, ANIM_DURATION);
  };

  const startIndex = page * PAGE_SIZE;
  const endIndex = Math.min(questions.length, startIndex + PAGE_SIZE);
  const pageQuestions = questions.slice(startIndex, endIndex);
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
        <Box
          sx={{
            transition: `opacity ${ANIM_DURATION}ms ease-out, transform ${ANIM_DURATION}ms ease-out, filter ${ANIM_DURATION}ms ease-out`,
            opacity: isFading ? 0 : 1,
            transform: isFading ? 'translateY(6px)' : 'translateY(0)',
            filter: isFading ? 'blur(3px)' : 'none',
            willChange: 'opacity, transform, filter',
          }}
        >
          {pageQuestions.map((question, idx) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={startIndex + idx}
              response={responses[question.id]}
              onResponseChange={onResponseChange}
              invitationRoleType={invitationRoleType}
            />
          ))}
        </Box>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mt: 2, mb: 2, justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'center', md: 'flex-start' },
            }}
          >
            <Button
              variant="outlined"
              onClick={animatedPrev}
              disabled={page === 0 || isFading}
              aria-label="Anterior"
              startIcon={<ArrowBackIosNewIcon />}
              sx={{
                width: { xs: '48%', md: 'auto' },
                minHeight: 48,
                px: 3,
                borderRadius: 3,
                boxShadow: 1,
                transition: 'transform 150ms ease',
                '&:hover': { transform: 'translateY(-2px)' },
                backgroundColor: 'background.paper',
              }}
            >
              Anterior
            </Button>

            <Button
              variant="contained"
              onClick={animatedNext}
              disabled={page >= totalPages - 1 || isFading}
              aria-label="Siguiente"
              endIcon={<ArrowForwardIosIcon />}
              sx={{
                width: { xs: '48%', md: 'auto' },
                minHeight: 48,
                px: 3,
                borderRadius: 3,
                boxShadow: 3,
                color: '#fff',
                background: gradient,
                '&:hover': { transform: 'translateY(-2px)', background: gradientHover },
                transition: 'transform 150ms ease',
                fontWeight: 700,
              }}
            >
              Siguiente
            </Button>
          </Box>

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Página {page + 1} de {totalPages} — Preguntas {startIndex + 1}–{endIndex} de {questions.length}
          </Typography>
        </Stack>

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
