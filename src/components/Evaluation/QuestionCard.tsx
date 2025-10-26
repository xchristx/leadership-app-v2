import { Paper, Box, Typography } from '@mui/material';
import { LikertQuestion } from './LikertQuestion';
import { TextQuestion } from './TextQuestion';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
import type { Question } from '../../types';

interface QuestionCardProps {
  question: Question;
  index: number;
  response: string | number | undefined;
  onResponseChange: (questionId: string, value: string | number) => void;
  invitationRoleType?: string;
}

export function QuestionCard({ question, index, response, onResponseChange, invitationRoleType }: QuestionCardProps) {
  const getQuestionText = () => {
    return invitationRoleType === 'leader' ? question.text_leader : question.text_collaborator;
  };

  const renderQuestionType = () => {
    switch (question.question_type) {
      case 'likert':
        return <LikertQuestion question={question} response={response} onResponseChange={onResponseChange} />;
      case 'text':
        return <TextQuestion question={question} response={response} onResponseChange={onResponseChange} />;
      case 'multiple_choice':
        return <MultipleChoiceQuestion question={question} response={response} onResponseChange={onResponseChange} />;
      default:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="warning.main">
              Tipo de pregunta no soportado: <strong>{question.question_type}</strong>
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        mb: { xs: 2, md: 3 },
        p: { xs: 1.5, md: 2.5 },
        pt: { xs: 3, md: 2.5 },
        border: response ? '2px solid' : '1px solid',
        borderColor: response ? 'success.light' : 'divider',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          elevation: 4,
          borderColor: 'primary.light',
        },
      }}
    >
      {/* Número de pregunta */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: -14, md: 14 },
          left: { xs: 14, md: 14 },
          minWidth: { xs: 28, md: 36 },
          height: { xs: 28, md: 36 },
          backgroundColor: 'primary.main',
          color: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: { xs: '0.8rem', md: '0.95rem' },
          flexShrink: 0,
          zIndex: 10,
          boxShadow: { xs: '0 2px 6px rgba(0,0,0,0.12)', md: 'none' },
        }}
      >
        {index + 1}
      </Box>

      {/* Header de pregunta */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: { xs: 0, md: 1.5 },
          mb: 2,
          pr: 0,
          pl: { xs: 0, md: 5 },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'medium',
            flexGrow: 1,
            fontSize: { xs: '0.95rem', md: '1.2rem' },
            lineHeight: 1.3,
            ml: { xs: 0, md: 0 },
          }}
        >
          {getQuestionText()}
        </Typography>
      </Box>

      {/* Contenido de la pregunta */}
      {renderQuestionType()}
    </Paper>
  );
}
