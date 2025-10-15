// ============================================================================
// COMPONENTE PRINCIPAL DE GESTIÓN DE CUESTIONARIOS
// ============================================================================

import { useState } from 'react';
import { Container, Box, Typography, Button, Alert, Fade } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { QuestionnaireForm } from '../components/Questionnaires';
import { useQuestionnaires } from '../hooks/useQuestionnaires';
import { useAuth } from '../hooks/useAuth';
import type { QuestionnaireFormData } from '../components/Questionnaires';
import { QuestionnaireList } from './components/QuestionnaireList';
import { QuestionnaireViewer } from './components/QuestionnaireViewer';
import { QuestionnaireEditor } from './components/QuestionnaireEditor';
import type { Database } from '../types/database.types';

type QuestionTemplate = Database['public']['Tables']['question_templates']['Row'];

type ViewMode = 'list' | 'create' | 'edit' | 'view';

interface ViewState {
  mode: ViewMode;
  selectedTemplate?: QuestionTemplate | null;
}

function QuestionnairesPage() {
  const [viewState, setViewState] = useState<ViewState>({ mode: 'list' });
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  // Obtener datos del usuario autenticado
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  // Hook para gestionar cuestionarios
  const { templates, loading, error: serviceError, createTemplate, deleteTemplate, clearError } = useQuestionnaires();

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

  // Renderizar según el modo actual
  const renderContent = () => {
    switch (viewState.mode) {
      case 'create':
        return <QuestionnaireForm mode="create" onSubmit={handleSubmit} onCancel={handleCancel} />;

      case 'edit':
        return (
          <QuestionnaireEditor
            open={true}
            templateId={viewState.selectedTemplate?.id || null}
            onClose={handleCancel}
            onSaved={() => {
              setSubmitResult('¡Cuestionario actualizado exitosamente!');
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
          <>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Gestión de Cuestionarios
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Administra los templates de cuestionarios para evaluaciones de liderazgo
                </Typography>
              </Box>
              <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={handleCreateNew} disabled={!organizationId}>
                Crear Cuestionario
              </Button>
            </Box>

            {/* Lista de cuestionarios */}
            <QuestionnaireList
              templates={templates}
              loading={loading}
              organizationId={organizationId}
              onView={handleViewTemplate}
              onEdit={handleEditTemplate}
              onDelete={handleDeleteTemplate}
              onCreate={handleCreateNew}
            />
          </>
        );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Alertas globales */}
      {submitResult && (
        <Fade in={!!submitResult}>
          <Alert
            severity={submitResult.includes('exitosamente') ? 'success' : 'error'}
            sx={{ mb: 3 }}
            onClose={() => setSubmitResult(null)}
          >
            {submitResult}
          </Alert>
        </Fade>
      )}

      {serviceError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {serviceError}
        </Alert>
      )}

      {!organizationId && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No se pudo obtener la información de la organización. Verifica tu sesión.
        </Alert>
      )}

      {/* Contenido dinámico */}
      {renderContent()}
    </Container>
  );
}

export default QuestionnairesPage;
