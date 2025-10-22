// ============================================================================
// COMPONENTE PRINCIPAL DE GESTIÓN DE CUESTIONARIOS - DISEÑO MEJORADO
// ============================================================================

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Fade,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
  Zoom,
  useMediaQuery,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Assessment as AssessmentIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { QuestionnaireForm } from '../components/Questionnaires';
import { useQuestionnaires } from '../hooks/useQuestionnaires';
import { useAuth } from '../hooks/useAuth';
import type { QuestionnaireFormData } from '../components/Questionnaires';
import { QuestionnaireList } from '../components/Questionaries/QuestionnaireList';
import { QuestionnaireViewer } from '../components/Questionaries/QuestionnaireViewer';
import { QuestionnaireEditor } from '../components/Questionaries/QuestionnaireEditor';
import type { Database } from '../types/database.types';
import { questionnaireService } from '../services/questionnaireService';

type QuestionTemplate = Database['public']['Tables']['question_templates']['Row'];

type ViewMode = 'list' | 'create' | 'edit' | 'view';

interface ViewState {
  mode: ViewMode;
  selectedTemplate?: QuestionTemplate | null;
}

function QuestionnairesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [viewState, setViewState] = useState<ViewState>({ mode: 'list' });
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  // Obtener datos del usuario autenticado
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  // Hook para gestionar cuestionarios
  const { templates, loading, error: serviceError, createTemplate, deleteTemplate, clearError } = useQuestionnaires();

  // Estadísticas para mostrar en el dashboard
  const stats = {
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
  };

  const handleSubmit = async (formData: QuestionnaireFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const templateId = await createTemplate(formData);
      console.log('Cuestionario creado con ID:', templateId);
      setSubmitResult('¡Cuestionario creado exitosamente!');
      setViewState({ mode: 'list' });
      return { success: true };
    } catch (error) {
      console.error('Error al crear cuestionario:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setSubmitResult('Error al crear el cuestionario: ' + errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const handleUpdateResult = (message: string, isNewVersion: boolean) => {
    if (isNewVersion) {
      setSubmitResult(`✨ ${message}`);
    } else {
      setSubmitResult('¡Cuestionario actualizado exitosamente!');
    }
  };

  const handleCancel = () => {
    setViewState({ mode: 'list' });
    setSubmitResult(null);
    clearError();
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      setSubmitResult('Cuestionario eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting template:', error);
      setSubmitResult('Error al eliminar el cuestionario');
    }
  };

  const handleViewTemplate = (template: QuestionTemplate) => {
    setViewState({ mode: 'view', selectedTemplate: template });
  };

  const handleEditTemplate = (template: QuestionTemplate) => {
    setViewState({ mode: 'edit', selectedTemplate: template });
  };

  const handleCreateNew = () => {
    setViewState({ mode: 'create' });
  };

  const handleTemplate5 = async () => {
    await questionnaireService.createLeadershipInventoryQuestionnaire('992f82cc-5bf1-4c04-ac39-120106ee05bd');
  };

  // Componente para las tarjetas de estadísticas
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
    <Zoom in timeout={800} style={{ transitionDelay: '200ms' }}>
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.05)} 0%, ${alpha(
            theme.palette[color].main,
            0.1
          )} 100%)`,
          border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
          borderRadius: 3,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 32px ${alpha(theme.palette[color].main, 0.15)}`,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight={800} color={`${color}.main`} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                bgcolor: alpha(theme.palette[color].main, 0.1),
                borderRadius: '50%',
                p: 1.5,
                color: theme.palette[color].main,
              }}
            >
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Zoom>
  );

  // Renderizar según el modo actual
  const renderContent = () => {
    switch (viewState.mode) {
      case 'create':
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <QuestionnaireForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} />
            </Grid>
          </Grid>
        );

      case 'edit':
        return (
          <QuestionnaireEditor
            open={true}
            templateId={viewState.selectedTemplate?.id || null}
            onClose={handleCancel}
            onSaved={(message, isNewVersion) => {
              handleUpdateResult(message || '¡Cuestionario actualizado exitosamente!', isNewVersion || false);
              setViewState({ mode: 'list' });
            }}
          />
        );

      case 'view':
        return (
          <QuestionnaireViewer
            template={viewState.selectedTemplate!}
            onEdit={() => handleEditTemplate(viewState.selectedTemplate!)}
            onClose={handleCancel}
          />
        );

      case 'list':
      default:
        return (
          <Grid container spacing={3}>
            {/* Header */}
            <Grid size={{ xs: 12 }}>
              <Fade in timeout={800}>
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(
                      theme.palette.secondary.main,
                      0.02
                    )} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    borderRadius: 3,
                    p: { xs: 2, md: 3 },
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Typography
                        variant="h3"
                        gutterBottom
                        sx={{
                          fontWeight: 800,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          letterSpacing: -0.5,
                          fontSize: { xs: '2rem', md: '2.5rem' },
                        }}
                      >
                        Gestión de Cuestionarios
                      </Typography>
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{
                          fontWeight: 500,
                          fontSize: { xs: '1rem', md: '1.25rem' },
                        }}
                      >
                        Administra los templates de cuestionarios para evaluaciones de liderazgo
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={`${stats.total} cuestionarios`}
                          color="primary"
                          variant="outlined"
                          size={isMobile ? 'small' : 'medium'}
                        />
                        <Chip label={`${stats.active} activos`} color="success" variant="outlined" size={isMobile ? 'small' : 'medium'} />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: { xs: 'flex-start', md: 'flex-end' },
                          gap: 2,
                        }}
                      >
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          size={isMobile ? 'medium' : 'large'}
                          onClick={handleCreateNew}
                          disabled={!organizationId}
                          sx={{
                            borderRadius: 3,
                            px: 3,
                            py: 1.5,
                            fontWeight: 700,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                            '&:hover': {
                              boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                              transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.3s ease',
                            minWidth: { xs: '100%', md: 'auto' },
                          }}
                        >
                          Crear Cuestionario
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Fade>
            </Grid>

            {/* Estadísticas */}
            <Grid sx={{ display: 'none' }} size={{ xs: 12 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatCard
                    title="Total Cuestionarios"
                    value={stats.total}
                    icon={<AssessmentIcon sx={{ fontSize: { xs: 20, md: 24 } }} />}
                    color="primary"
                    subtitle="Todos los templates"
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <StatCard
                    title="Cuestionarios Activos"
                    value={stats.active}
                    icon={<TrendingUpIcon sx={{ fontSize: { xs: 20, md: 24 } }} />}
                    color="success"
                    subtitle="En uso actual"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Lista de cuestionarios */}
            <Grid size={{ xs: 12 }}>
              <QuestionnaireList
                templates={templates}
                loading={loading}
                organizationId={organizationId}
                onView={handleViewTemplate}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                onCreate={handleCreateNew}
              />
            </Grid>

            {/* Botón oculto para template específico */}
            <Grid size={{ xs: 12 }} sx={{ display: 'none' }}>
              <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={handleTemplate5} disabled={!organizationId}>
                Crear template de liderazgo
              </Button>
            </Grid>
          </Grid>
        );
    }
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 2, md: 4 },
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(
          theme.palette.background.paper,
          0.8
        )} 100%)`,
        minHeight: '100vh',
      }}
    >
      {/* Alertas globales */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12 }}>
          {submitResult && (
            <Fade in={!!submitResult}>
              <Alert
                severity={submitResult.includes('exitosamente') || submitResult.includes('✨') ? 'success' : 'error'}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  border: `1px solid ${
                    submitResult.includes('exitosamente') || submitResult.includes('✨')
                      ? theme.palette.success.light
                      : theme.palette.error.light
                  }`,
                }}
                onClose={() => setSubmitResult(null)}
              >
                {submitResult}
              </Alert>
            </Fade>
          )}

          {serviceError && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.error.light}`,
              }}
              onClose={clearError}
            >
              {serviceError}
            </Alert>
          )}

          {!organizationId && (
            <Alert
              severity="warning"
              sx={{
                mb: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.warning.light}`,
              }}
            >
              No se pudo obtener la información de la organización. Verifica tu sesión.
            </Alert>
          )}
        </Grid>
      </Grid>

      {/* Contenido dinámico */}
      {renderContent()}
    </Container>
  );
}

export default QuestionnairesPage;
