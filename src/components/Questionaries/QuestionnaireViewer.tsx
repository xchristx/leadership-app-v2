// ============================================================================
// COMPONENTE DE VISUALIZACIÓN DE CUESTIONARIOS
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, ExpandMore as ExpandMoreIcon, Quiz as QuizIcon } from '@mui/icons-material';
import { questionnaireService } from '../../services/questionnaireService';
import type { Database } from '../../types/database.types';

type QuestionTemplate = Database['public']['Tables']['question_templates']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];

interface QuestionnaireViewerProps {
  template: QuestionTemplate;
  onEdit: () => void;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export function QuestionnaireViewer({ template, onEdit, onClose }: QuestionnaireViewerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await questionnaireService.getTemplateWithQuestions(template.id);
        setQuestions(data.questions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error cargando detalles');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [template.id]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };
  console.log({ questions });
  const renderQuestionPreview = (question: Question, isLeaderView: boolean) => {
    const questionText = isLeaderView ? question.text_leader : question.text_collaborator;

    return (
      <Accordion key={`${question.id}_${isLeaderView ? 'leader' : 'collaborator'}`}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              {questionText}
            </Typography>
            <Chip label={question.question_type} size="small" variant="outlined" color="primary" />
            {question.category && (
              <Chip
                label={
                  typeof question.category === 'string'
                    ? question.category
                    : (question.category as { name?: string; id?: string })?.name || 'Categoría'
                }
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ pl: 2 }}>
            {/* Renderizar preview según el tipo de pregunta */}
            {question.question_type === 'likert' && (
              <Box sx={{ mt: 2 }}>
                <FormControl component="fieldset">
                  <RadioGroup row>
                    {Array.from({ length: (question?.response_config as { scale?: number })?.scale || 5 }, (_, i) => (
                      <FormControlLabel key={i + 1} value={i + 1} control={<Radio disabled size="small" />} label={i + 1} />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Box>
            )}

            {question.question_type === 'text' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Respuesta de texto libre..."
                disabled
                variant="outlined"
                sx={{ mt: 2 }}
              />
            )}

            {question.question_type === 'multiple_choice' && (
              <FormControl component="fieldset" sx={{ mt: 2 }}>
                <FormLabel component="legend">Opciones disponibles</FormLabel>
                <RadioGroup>
                  {/* Simulamos opciones ya que response_config puede variar */}
                  <FormControlLabel value="option1" control={<Radio disabled />} label="Opción ejemplo 1" />
                  <FormControlLabel value="option2" control={<Radio disabled />} label="Opción ejemplo 2" />
                  <FormControlLabel value="option3" control={<Radio disabled />} label="Opción ejemplo 3" />
                </RadioGroup>
              </FormControl>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderQuestionsTab = (isLeaderView: boolean) => {
    const groupedQuestions = questions.reduce((acc, question) => {
      let categoryKey = 'General';

      if (question.category) {
        if (typeof question.category === 'string') {
          categoryKey = question.category;
        } else {
          // Es un objeto JSON, extraer el nombre
          const categoryObj = question.category as { name?: string; id?: string };
          categoryKey = categoryObj?.name || categoryObj?.id || 'General';
        }
      }

      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }
      acc[categoryKey].push(question);
      return acc;
    }, {} as Record<string, Question[]>);

    return (
      <Box>
        {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
          <Box key={category} sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              {category}
            </Typography>
            <Box sx={{ pl: 2 }}>
              {categoryQuestions
                .sort((a, b) => a.order_index - b.order_index)
                .map(question => renderQuestionPreview(question, isLeaderView))}
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando detalles del cuestionario...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={onClose} variant="outlined">
            Volver
          </Button>
          <QuizIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {template.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Vista previa del cuestionario
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
          Editar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Información general */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información General
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Descripción
            </Typography>
            <Typography variant="body1" paragraph>
              {template.description || 'Sin descripción'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                label={template.is_active ? 'Activo' : 'Inactivo'}
                color={template.is_active ? 'success' : 'default'}
                variant="outlined"
              />
              <Chip label={`${questions.length} preguntas`} color="primary" variant="outlined" />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Creado:{' '}
              {new Date(template.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs para vista líder y colaborador */}
      <Card sx={{ px: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={handleTabChange} aria-label="questionnaire tabs">
            <Tab label="Vista para Líderes" id="tab-0" aria-controls="tabpanel-0" />
            <Tab label="Vista para Colaboradores" id="tab-1" aria-controls="tabpanel-1" />
            <Tab label="Estadísticas" id="tab-2" aria-controls="tabpanel-2" />
          </Tabs>
        </Box>

        <TabPanel value={selectedTab} index={0}>
          <Typography variant="h6" gutterBottom color="primary">
            Cuestionario para Líderes
          </Typography>
          {renderQuestionsTab(true)}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          <Typography variant="h6" gutterBottom color="secondary">
            Cuestionario para Colaboradores
          </Typography>
          {renderQuestionsTab(false)}
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Estadísticas del Cuestionario
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {questions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de preguntas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">
                    {
                      new Set(
                        questions.map(q => {
                          if (!q.category) return 'General';
                          if (typeof q.category === 'string') return q.category;
                          return (q.category as { name?: string; id?: string })?.name || 'General';
                        })
                      ).size
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Categorías
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {questions.filter(q => q.question_type === 'likert').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Escalas Likert
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {questions.filter(q => q.question_type === 'text').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Texto libre
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
}
