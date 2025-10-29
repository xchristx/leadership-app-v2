// ============================================================================
// COMPONENTE DE EDICIÓN DE CUESTIONARIOS
// ============================================================================

import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Box, CircularProgress, Typography } from '@mui/material';
import { QuestionnaireForm } from '../Questionnaires';
import { questionnaireService } from '../../services/questionnaireService';
import type { QuestionnaireFormData } from '../Questionnaires';
import type { Database } from '../../types/database.types';
import { useQuestionnaires } from '../../hooks';

type QuestionTemplate = Database['public']['Tables']['question_templates']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];

interface QuestionnaireEditorProps {
  open: boolean;
  templateId: string | null;
  onClose: () => void;
  onSaved: (message?: string, isNewVersion?: boolean) => void;
}

export function QuestionnaireEditor({ open, templateId, onClose, onSaved }: QuestionnaireEditorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateData, setTemplateData] = useState<{
    template: QuestionTemplate;
    questions: Question[];
  } | null>(null);

  const { updateTemplate } = useQuestionnaires();

  // Cargar datos del template cuando se abre el diálogo
  useEffect(() => {
    const loadTemplateData = async () => {
      if (!templateId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await questionnaireService.getTemplateWithQuestions(templateId);
        setTemplateData(data);
      } catch (err) {
        console.error('Error loading template data:', err);
        setError(err instanceof Error ? err.message : 'Error cargando datos del cuestionario');
      } finally {
        setLoading(false);
      }
    };

    if (open && templateId) {
      loadTemplateData();
    } else {
      setTemplateData(null);
      setError(null);
    }
  }, [open, templateId]);

  const retryLoad = async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await questionnaireService.getTemplateWithQuestions(templateId);
      setTemplateData(data);
    } catch (err) {
      console.error('Error loading template data:', err);
      setError(err instanceof Error ? err.message : 'Error cargando datos del cuestionario');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: QuestionnaireFormData): Promise<{ success: boolean; error?: string }> => {
    if (!templateId) {
      return { success: false, error: 'No template ID provided' };
    }
    try {
      console.log('Update template data:', formData);

      // Actualización inteligente con manejo de versionado
      const result = await updateTemplate(templateId, formData);

      // Pasar información de la actualización al componente padre
      onSaved(result.message, result.isNewVersion);
      onClose();

      return { success: true };
    } catch (error) {
      console.error('Error updating questionnaire:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  };

  const convertToFormData = (template: QuestionTemplate, questions: Question[]): QuestionnaireFormData => {
    // Extraer categorías únicas de las preguntas
    const uniqueCategories = new Map<string, { id: string; name: string; description?: string; color?: string; order_index: number }>();
    let categoryIndex = 0;

    questions.forEach(question => {
      if (question.category) {
        let categoryData;

        if (typeof question.category === 'string') {
          // Categoría antigua como string
          categoryData = {
            id: question.category,
            name: question.category,
            description: '',
            color: '#1976d2',
            order_index: categoryIndex++,
          };
        } else {
          // Categoría nueva como JSON
          const catObj = question.category as { id?: string; name?: string; description?: string; color?: string };
          categoryData = {
            id: catObj.id || catObj.name || `category_${categoryIndex}`,
            name: catObj.name || catObj.id || `Categoría ${categoryIndex + 1}`,
            description: catObj.description || '',
            color: catObj.color || '#1976d2',
            order_index: categoryIndex++,
          };
        }

        if (!uniqueCategories.has(categoryData.id)) {
          uniqueCategories.set(categoryData.id, categoryData);
        }
      }
    });

    return {
      title_leader: template.title || '',
      title_collaborator: template.title_collaborator || '',
      description_leader: template.description || '',
      description_collaborator: template.description_collaborator || '',
      version_type: 'both' as const,
      is_active: template.is_active || false,
      use_categories: questions.some(q => q.category),
      categories: Array.from(uniqueCategories.values()),
      questions: questions.map((q, index) => {
        let categoryId: string | undefined = undefined;

        if (q.category) {
          if (typeof q.category === 'string') {
            categoryId = q.category;
          } else {
            const catObj = q.category as { id?: string; name?: string };
            categoryId = catObj.id || catObj.name;
          }
        }

        return {
          id: q.id,
          text_leader: q.text_leader,
          text_collaborator: q.text_collaborator,
          question_type: (q.question_type || 'text') as 'text' | 'multiple_choice' | 'likert',
          category_id: categoryId,
          response_config: {
            scale: (q.response_config as Record<string, unknown>)?.scale as number,
            scale_labels: (q.response_config as Record<string, unknown>)?.scale_labels as string[],
            options: (q.response_config as Record<string, unknown>)?.options as string[],
            min_label: (q.response_config as Record<string, unknown>)?.min_label as string,
            max_label: (q.response_config as Record<string, unknown>)?.max_label as string,
          },
          order_index: q.order_index || index,
          is_active: q.is_active || false,
        };
      }),
    };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen>
      <DialogTitle>Editar Cuestionario</DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Cargando datos del cuestionario...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button variant="outlined" onClick={retryLoad}>
              Reintentar
            </Button>
          </Box>
        ) : templateData ? (
          <QuestionnaireForm
            mode="edit"
            initialData={convertToFormData(templateData.template, templateData.questions)}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        ) : (
          <Box sx={{ p: 3 }}>
            <Alert severity="info">No se encontraron datos del cuestionario</Alert>
          </Box>
        )}
      </DialogContent>

      {!loading && !templateData && (
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
