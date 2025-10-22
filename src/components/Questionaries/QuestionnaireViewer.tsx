// ============================================================================
// COMPONENTE DE VISUALIZACIÓN DE CUESTIONARIOS - DISEÑO MEJORADO
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
  alpha,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  Stack,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Quiz as QuizIcon,
  Psychology as PsychologyIcon,
  Group as GroupIcon,
  Analytics as AnalyticsIcon,
  Leaderboard as LeaderboardIcon,
  TextFields as TextFieldsIcon,
  Checklist as ChecklistIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
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
      {value === index && <Box sx={{ py: { xs: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

export function QuestionnaireViewer({ template, onEdit, onClose }: QuestionnaireViewerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  // Estadísticas para mostrar
  const stats = {
    totalQuestions: questions.length,
    categories: new Set(
      questions.map(q => {
        if (!q.category) return 'General';
        if (typeof q.category === 'string') return q.category;
        return (q.category as { name?: string; id?: string })?.name || 'General';
      })
    ).size,
    likertQuestions: questions.filter(q => q.question_type === 'likert').length,
    textQuestions: questions.filter(q => q.question_type === 'text').length,
    multipleChoiceQuestions: questions.filter(q => q.question_type === 'multiple_choice').length,
  };

  // Función para obtener icono según tipo de pregunta
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'likert':
        return <LeaderboardIcon />;
      case 'text':
        return <TextFieldsIcon />;
      case 'multiple_choice':
        return <ChecklistIcon />;
      default:
        return <QuizIcon />;
    }
  };

  // Función para obtener color según tipo de pregunta
  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'likert':
        return 'warning';
      case 'text':
        return 'info';
      case 'multiple_choice':
        return 'success';
      default:
        return 'primary';
    }
  };

  const renderQuestionPreview = (question: Question, isLeaderView: boolean) => {
    const questionText = isLeaderView ? question.text_leader : question.text_collaborator;
    const questionType = question.question_type;

    return (
      <Zoom in timeout={600}>
        <Accordion
          key={`${question.id}_${isLeaderView ? 'leader' : 'collaborator'}`}
          sx={{
            mb: 2,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            '&:before': { display: 'none' },
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.3),
              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.1)}`,
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              borderRadius: 2,
              '&.Mui-expanded': {
                minHeight: 48,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, sm: 2 }, width: '100%' }}>
              <Avatar
                sx={{
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  bgcolor: alpha(theme.palette[getQuestionTypeColor(questionType!)].main, 0.1),
                  color: theme.palette[getQuestionTypeColor(questionType!)].main,
                  mt: 0.5,
                  flexShrink: 0,
                }}
              >
                {getQuestionTypeIcon(questionType!)}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: 1,
                    wordBreak: 'break-word',
                  }}
                >
                  {questionText}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label={questionType === 'likert' ? 'Escala' : questionType === 'text' ? 'Texto' : 'Opción múltiple'}
                    size="small"
                    variant="outlined"
                    color={getQuestionTypeColor(questionType!)}
                    sx={{ fontWeight: 600 }}
                  />
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
                      icon={<CategoryIcon sx={{ fontSize: 16 }} />}
                    />
                  )}
                </Stack>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), px: { xs: 2, sm: 3 } }}>
            <Box sx={{ pl: { xs: 0, md: 2 } }}>
              {/* Renderizar preview según el tipo de pregunta */}
              {question.question_type === 'likert' && (
                <Box sx={{ mt: 2 }}>
                  <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2, display: 'block' }}>
                    Escala de respuesta (1-{(question?.response_config as { scale?: number })?.scale || 5})
                  </FormLabel>
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup row sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      {Array.from({ length: (question?.response_config as { scale?: number })?.scale || 5 }, (_, i) => (
                        <FormControlLabel
                          key={i + 1}
                          value={i + 1}
                          control={<Radio disabled size="small" />}
                          label={i + 1}
                          sx={{
                            mx: { xs: 0.5, sm: 1 },
                            mb: 1,
                            '& .MuiFormControlLabel-label': {
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            },
                          }}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Box>
              )}

              {question.question_type === 'text' && (
                <Box sx={{ mt: 2 }}>
                  <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2, display: 'block' }}>
                    Respuesta de texto libre
                  </FormLabel>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="El usuario podrá escribir su respuesta aquí..."
                    disabled
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: theme.palette.background.paper,
                      },
                    }}
                  />
                </Box>
              )}

              {question.question_type === 'multiple_choice' && (
                <Box sx={{ mt: 2 }}>
                  <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2, display: 'block' }}>
                    Selecciona una opción
                  </FormLabel>
                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup>
                      {/* Simulamos opciones ya que response_config puede variar */}
                      <FormControlLabel value="option1" control={<Radio disabled />} label="Opción de ejemplo 1" sx={{ mb: 1 }} />
                      <FormControlLabel value="option2" control={<Radio disabled />} label="Opción de ejemplo 2" sx={{ mb: 1 }} />
                      <FormControlLabel value="option3" control={<Radio disabled />} label="Opción de ejemplo 3" sx={{ mb: 1 }} />
                    </RadioGroup>
                  </FormControl>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Zoom>
    );
  };

  const renderQuestionsTab = (isLeaderView: boolean) => {
    const groupedQuestions = questions.reduce((acc, question) => {
      let categoryKey = 'General';

      if (question.category) {
        if (typeof question.category === 'string') {
          categoryKey = question.category;
        } else {
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
          <Box key={category} sx={{ mb: { xs: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <CategoryIcon color="primary" />
              <Typography variant="h6" color="primary" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
                {category}
              </Typography>
              <Chip label={`${categoryQuestions.length} preguntas`} size="small" variant="outlined" sx={{ ml: { xs: 0, sm: 1 } }} />
            </Box>
            <Box sx={{ pl: { xs: 0, md: 2 } }}>
              {categoryQuestions
                .sort((a, b) => a.order_index - b.order_index)
                .map(question => renderQuestionPreview(question, isLeaderView))}
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  // Componente para tarjetas de estadísticas
  const StatCard = ({
    title,
    value,
    icon,
    color = 'primary',
    subtitle,
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
    subtitle?: string;
  }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.05)} 0%, ${alpha(theme.palette[color].main, 0.1)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: isMobile ? 'none' : 'translateY(-4px)',
          boxShadow: `0 8px 32px ${alpha(theme.palette[color].main, 0.15)}`,
        },
      }}
    >
      <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: 48, sm: 56, md: 60 },
            height: { xs: 48, sm: 56, md: 60 },
            borderRadius: '50%',
            bgcolor: alpha(theme.palette[color].main, 0.1),
            color: theme.palette[color].main,
            mb: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant={isMobile ? 'h4' : 'h3'} fontWeight={800} color={`${color}.main`}>
          {value}
        </Typography>
        <Typography variant={isMobile ? 'subtitle2' : 'h6'} fontWeight={600} gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8, flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={40} />
        <Typography variant="h6" color="text.secondary">
          Cargando detalles del cuestionario...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        px: { xs: 0.5, sm: 1, md: 2 },
        py: { xs: 1, sm: 2, md: 3 },
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {/* Header */}
      <Fade in timeout={800}>
        <Card
          sx={{
            mb: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(
              theme.palette.secondary.main,
              0.02
            )} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Button startIcon={<ArrowBackIcon />} onClick={onClose} variant="outlined" size={isMobile ? 'small' : 'medium'}>
                    Volver
                  </Button>
                  <Avatar
                    sx={{
                      width: { xs: 36, sm: 40, md: 48 },
                      height: { xs: 36, sm: 40, md: 48 },
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    }}
                  >
                    <QuizIcon />
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant={isMobile ? 'h6' : 'h4'}
                      component="h1"
                      gutterBottom
                      sx={{ fontWeight: 800, wordBreak: 'break-word' }}
                    >
                      {template.title}
                    </Typography>
                    <Typography variant={isMobile ? 'body2' : 'body1'} color="text.secondary" sx={{ fontWeight: 500 }}>
                      Vista previa del cuestionario
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={template.is_active ? 'Activo' : 'Inactivo'}
                    color={template.is_active ? 'success' : 'default'}
                    variant="outlined"
                    size={isMobile ? 'small' : 'medium'}
                  />
                  <Chip label={`${questions.length} preguntas`} color="primary" variant="outlined" size={isMobile ? 'small' : 'medium'} />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={onEdit}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                      borderRadius: 3,
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                    }}
                  >
                    Editar
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Fade>

      {error && (
        <Fade in timeout={800}>
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.error.light}`,
            }}
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* Información general */}
      <Fade in timeout={800} style={{ transitionDelay: '200ms' }}>
        <Paper
          sx={{
            p: { xs: 1.5, sm: 2, md: 3 },
            mb: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight={700} sx={{ mb: 3 }}>
            📋 Información General
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight={600}>
                Descripción
              </Typography>
              <Typography variant="body1" paragraph sx={{ lineHeight: 1.6, wordBreak: 'break-word' }}>
                {template.description || 'Este cuestionario no tiene descripción disponible.'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }} fontWeight={600}>
                    Fecha de creación:
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {new Date(template.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }} fontWeight={600}>
                    Última actualización:
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {new Date(template.updated_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      {/* Tabs para vista líder y colaborador */}
      <Fade in timeout={800} style={{ transitionDelay: '400ms' }}>
        <Card
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 1, md: 2 } }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              aria-label="questionnaire tabs"
              variant={isMobile ? 'scrollable' : 'standard'}
              scrollButtons={isMobile ? 'auto' : false}
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: { xs: '0.8rem', md: '0.9rem' },
                  py: { xs: 1, md: 2 },
                  minHeight: 'auto',
                  minWidth: { xs: 'auto', md: 160 },
                },
              }}
            >
              <Tab
                icon={<PsychologyIcon sx={{ mr: 1, fontSize: { xs: 18, md: 20 } }} />}
                iconPosition="start"
                label={isMobile ? 'Líderes' : 'Vista para Líderes'}
              />
              <Tab
                icon={<GroupIcon sx={{ mr: 1, fontSize: { xs: 18, md: 20 } }} />}
                iconPosition="start"
                label={isMobile ? 'Colaboradores' : 'Vista para Colaboradores'}
              />
              <Tab
                icon={<AnalyticsIcon sx={{ mr: 1, fontSize: { xs: 18, md: 20 } }} />}
                iconPosition="start"
                label={isMobile ? 'Estadísticas' : 'Estadísticas'}
              />
            </Tabs>
          </Box>

          <TabPanel value={selectedTab} index={0}>
            <Typography variant="h6" gutterBottom color="primary" fontWeight={700} sx={{ mb: 3 }}>
              👑 Cuestionario para Líderes
            </Typography>
            {renderQuestionsTab(true)}
          </TabPanel>

          <TabPanel value={selectedTab} index={1}>
            <Typography variant="h6" gutterBottom color="secondary" fontWeight={700} sx={{ mb: 3 }}>
              👥 Cuestionario para Colaboradores
            </Typography>
            {renderQuestionsTab(false)}
          </TabPanel>

          <TabPanel value={selectedTab} index={2}>
            <Typography variant="h6" gutterBottom fontWeight={700} sx={{ mb: 3 }}>
              📊 Estadísticas del Cuestionario
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <StatCard
                  title="Total Preguntas"
                  value={stats.totalQuestions}
                  icon={<QuizIcon />}
                  color="primary"
                  subtitle="Preguntas en total"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <StatCard
                  title="Categorías"
                  value={stats.categories}
                  icon={<CategoryIcon />}
                  color="secondary"
                  subtitle="Categorías diferentes"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <StatCard
                  title="Escalas Likert"
                  value={stats.likertQuestions}
                  icon={<LeaderboardIcon />}
                  color="warning"
                  subtitle="Preguntas de escala"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <StatCard
                  title="Texto Libre"
                  value={stats.textQuestions}
                  icon={<TextFieldsIcon />}
                  color="info"
                  subtitle="Preguntas abiertas"
                />
              </Grid>
            </Grid>

            {/* Distribución de tipos de preguntas */}
            {stats.totalQuestions > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Distribución de Tipos de Preguntas
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { type: 'likert', label: 'Escalas Likert', value: stats.likertQuestions, color: 'warning' as const },
                    { type: 'text', label: 'Texto Libre', value: stats.textQuestions, color: 'info' as const },
                    { type: 'multiple_choice', label: 'Opción Múltiple', value: stats.multipleChoiceQuestions, color: 'success' as const },
                  ].map(item => (
                    <Grid size={{ xs: 12 }} key={item.type}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ minWidth: { xs: 'auto', sm: 120 }, fontWeight: 600, flexShrink: 0 }}>
                          {item.label}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(item.value / stats.totalQuestions) * 100}
                          sx={{
                            flexGrow: 1,
                            height: { xs: 6, sm: 8 },
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette[item.color].main, 0.2),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: theme.palette[item.color].main,
                              borderRadius: 4,
                            },
                          }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: { xs: 'auto', sm: 40 }, textAlign: 'right' }}>
                          {item.value} ({Math.round((item.value / stats.totalQuestions) * 100)}%)
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </TabPanel>
        </Card>
      </Fade>
    </Box>
  );
}
