import { Box, Typography, TextField, Paper } from '@mui/material';
import type { Question } from '../../types';

interface TextQuestionProps {
  question: Question;
  response: string | number | undefined;
  onResponseChange: (questionId: string, value: string | number) => void;
}

export function TextQuestion({ question, response, onResponseChange }: TextQuestionProps) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5, color: 'primary.main', fontSize: { xs: '0.9rem', md: '1rem' } }}>
        Respuesta Abierta
      </Typography>
      <Paper
        elevation={1}
        sx={{
          p: 1.5,
          backgroundColor: 'background.default',
          border: '2px dashed',
          borderColor: response ? 'primary.main' : 'grey.300',
          transition: 'all 0.3s ease',
        }}
      >
        <TextField
          fullWidth
          multiline
          rows={4}
          value={response || ''}
          onChange={e => onResponseChange(question.id, e.target.value)}
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
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
          Tip: Sé específico y proporciona ejemplos cuando sea posible
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
          {(response as string)?.length || 0} caracteres
        </Typography>
      </Box>
    </Box>
  );
}
