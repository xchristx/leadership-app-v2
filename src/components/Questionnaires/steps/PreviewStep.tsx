// ============================================================================
// PASO 4: VISTA PREVIA DEL CUESTIONARIO
// ============================================================================

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
} from '@mui/material';
import type { QuestionnaireFormData, QuestionFormData } from '../types';

interface PreviewStepProps {
  values: QuestionnaireFormData;
}

export function PreviewStep({ values }: PreviewStepProps) {
  const getCategoryName = (categoryId: string) => {
    return values.categories.find(cat => cat.id === categoryId)?.name || 'Sin categoría';
  };

  const renderQuestionPreview = (question: QuestionFormData, isLeaderView: boolean) => {
    const questionText = isLeaderView ? question.text_leader : question.text_collaborator;

    return (
      <Card key={`${question.id}_${isLeaderView ? 'leader' : 'collaborator'}`} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {values.use_categories && question.category_id && (
              <Chip label={getCategoryName(question.category_id)} size="small" color="primary" />
            )}
            <Chip label={question.question_type} size="small" variant="outlined" />
          </Box>

          <Typography variant="body1" gutterBottom>
            {questionText}
          </Typography>

          {/* Renderizar preview del tipo de pregunta */}
          {question.question_type === 'likert' && (
            <Box sx={{ mt: 2 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">
                  {question.response_config.min_label} - {question.response_config.max_label}
                </FormLabel>
                <RadioGroup row>
                  {Array.from({ length: question.response_config.scale || 5 }, (_, i) => (
                    <FormControlLabel key={i + 1} value={i + 1} control={<Radio disabled />} label={i + 1} />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>
          )}

          {question.question_type === 'text' && (
            <TextField fullWidth multiline rows={3} placeholder="Respuesta del usuario..." disabled sx={{ mt: 2 }} />
          )}

          {question.question_type === 'multiple_choice' && question.response_config.options && (
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <RadioGroup>
                {question.response_config.options.map((option, index) => (
                  <FormControlLabel key={index} value={option} control={<Radio disabled />} label={option} />
                ))}
              </RadioGroup>
            </FormControl>
          )}
        </CardContent>
      </Card>
    );
  };

  const groupedQuestions = values.use_categories
    ? values.categories.map(category => ({
        category,
        questions: values.questions.filter(q => q.category_id === category.id),
      }))
    : [{ category: null, questions: values.questions }];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" gutterBottom>
        Vista Previa del Cuestionario
      </Typography>

      {/* Resumen */}
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Resumen
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Tipo
            </Typography>
            <Typography variant="body1">
              {values.version_type === 'both'
                ? 'Líderes y Colaboradores'
                : values.version_type === 'leader'
                ? 'Solo Líderes'
                : 'Solo Colaboradores'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Preguntas
            </Typography>
            <Typography variant="body1">{values.questions.length}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Categorías
            </Typography>
            <Typography variant="body1">{values.use_categories ? values.categories.length : 'No usa'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Estado
            </Typography>
            <Chip label={values.is_active ? 'Activo' : 'Inactivo'} color={values.is_active ? 'success' : 'default'} size="small" />
          </Grid>
        </Grid>
      </Paper>

      {/* Validaciones */}
      <Box>
        {values.questions.length === 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Debe agregar al menos una pregunta para crear el cuestionario.
          </Alert>
        )}

        {values.use_categories && values.categories.length === 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Si usa categorías, debe crear al menos una categoría.
          </Alert>
        )}

        {values.use_categories && values.questions.some(q => !q.category_id) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Todas las preguntas deben tener una categoría asignada.
          </Alert>
        )}
      </Box>

      {/* Preview por versión */}
      {values.questions.length > 0 && (
        <>
          {(values.version_type === 'both' || values.version_type === 'leader') && (
            <Box>
              <Typography variant="h6" color="primary" gutterBottom>
                Vista para Líderes
              </Typography>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {values.title_leader}
                  </Typography>
                  {values.description_leader && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {values.description_leader}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {groupedQuestions.map(({ category, questions }, index) => (
                <Box key={index}>
                  {category && (
                    <>
                      <Typography variant="h6" color="primary" sx={{ mt: 2, mb: 1 }}>
                        {category.name}
                      </Typography>
                      {category.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {category.description}
                        </Typography>
                      )}
                    </>
                  )}
                  {questions.map(question => renderQuestionPreview(question, true))}
                </Box>
              ))}
            </Box>
          )}

          {(values.version_type === 'both' || values.version_type === 'collaborator') && (
            <Box>
              <Typography variant="h6" color="secondary" gutterBottom>
                Vista para Colaboradores
              </Typography>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {values.title_collaborator}
                  </Typography>
                  {values.description_collaborator && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {values.description_collaborator}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {groupedQuestions.map(({ category, questions }, index) => (
                <Box key={index}>
                  {category && (
                    <>
                      <Typography variant="h6" color="secondary" sx={{ mt: 2, mb: 1 }}>
                        {category.name}
                      </Typography>
                      {category.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {category.description}
                        </Typography>
                      )}
                    </>
                  )}
                  {questions.map(question => renderQuestionPreview(question, false))}
                </Box>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
