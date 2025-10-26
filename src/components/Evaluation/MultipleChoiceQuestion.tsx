import { Box, Typography, RadioGroup, FormControlLabel, Radio, Paper } from '@mui/material';
import type { Question } from '../../types';

interface MultipleChoiceQuestionProps {
  question: Question;
  response: string | number | undefined;
  onResponseChange: (questionId: string, value: string | number) => void;
}

export function MultipleChoiceQuestion({ question, response, onResponseChange }: MultipleChoiceQuestionProps) {
  const config = question.response_config as Record<string, unknown>;
  const options = (config?.options as string[]) || [];

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5, color: 'primary.main', fontSize: { xs: '0.9rem', md: '1rem' } }}>
        Selección Múltiple
      </Typography>
      <RadioGroup value={response || ''} onChange={e => onResponseChange(question.id, e.target.value)} sx={{ gap: 1 }}>
        {options.map((option, optIndex) => (
          <Paper
            key={optIndex}
            elevation={response === option ? 3 : 1}
            sx={{
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              border: '2px solid',
              borderColor: response === option ? 'primary.main' : 'divider',
              backgroundColor: response === option ? 'primary.light' : 'background.paper',
              '&:hover': {
                borderColor: 'primary.main',
                elevation: 2,
              },
            }}
            onClick={() => onResponseChange(question.id, option)}
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
                  color: response === option ? 'primary.main' : 'text.primary',
                },
              }}
            />
          </Paper>
        ))}
      </RadioGroup>
    </Box>
  );
}
