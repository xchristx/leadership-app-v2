// ============================================================================
// HOOK PARA GESTIÓN DE CUESTIONARIOS
// ============================================================================
// Hook personalizado para manejar templates de cuestionarios
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { questionnaireService } from '../services/questionnaireService';
import { useAuth } from './useAuth';
import type { Database } from '../types/database.types';
import type { QuestionnaireFormData } from '../components/Questionnaires';

type QuestionTemplate = Database['public']['Tables']['question_templates']['Row'];

interface UseQuestionnairesResult {
    templates: QuestionTemplate[];
    loading: boolean;
    error: string | null;
    loadTemplates: () => Promise<void>;
    createTemplate: (formData: QuestionnaireFormData) => Promise<string>;
    deleteTemplate: (templateId: string) => Promise<void>;
    updateTemplate: (templateId: string, formData: QuestionnaireFormData) => Promise<{ templateId: string; isNewVersion: boolean; message?: string }>;
    getTemplateWithQuestions: (templateId: string) => Promise<{ template: QuestionTemplate; questions: Database['public']['Tables']['questions']['Row'][]; categories: Array<{ id: string; name: string; description?: string; color?: string }> }>;
    getCategoriesByTemplate: (templateId: string) => Promise<Array<{ id: string; name: string; description?: string; color?: string }>>;
    clearError: () => void;
}

export function useQuestionnaires(): UseQuestionnairesResult {
    const { profile } = useAuth();
    const organizationId = profile?.organization_id;
    const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadTemplates = useCallback(async () => {
        if (!organizationId) return;

        try {
            setLoading(true);
            setError(null);
            const data = await questionnaireService.getTemplates(organizationId);
            setTemplates(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error loading templates';
            setError(errorMessage);
            console.error('Error loading templates:', err);
        } finally {
            setLoading(false);
        }
    }, [organizationId]);

    const createTemplate = useCallback(async (formData: QuestionnaireFormData): Promise<string> => {
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }

        try {
            setError(null);
            // Usar método principal ya que RLS está funcionando
            const templateId = await questionnaireService.createQuestionnaire({
                ...formData,
                organizationId
            });
            await loadTemplates(); // Recargar lista
            return templateId;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error creating template';
            setError(errorMessage);
            throw err;
        }
    }, [organizationId, loadTemplates]);

    const deleteTemplate = useCallback(async (templateId: string): Promise<void> => {
        try {
            setError(null);
            await questionnaireService.deleteTemplate(templateId);
            await loadTemplates(); // Recargar lista
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error deleting template';
            setError(errorMessage);
            throw err;
        }
    }, [loadTemplates]);

    const getTemplateWithQuestions = useCallback(async (templateId: string) => {
        try {
            setError(null);
            return await questionnaireService.getTemplateWithQuestions(templateId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error loading template details';
            setError(errorMessage);
            throw err;
        }
    }, []);

    const updateTemplate = useCallback(async (templateId: string, formData: QuestionnaireFormData): Promise<{ templateId: string; isNewVersion: boolean; message?: string }> => {
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }

        try {
            setError(null);
            const result = await questionnaireService.updateQuestionnaireIntelligent(templateId, {
                ...formData,
                organizationId
            });
            await loadTemplates(); // Recargar lista
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error updating template';
            setError(errorMessage);
            throw err;
        }
    }, [organizationId, loadTemplates]);

    const getCategoriesByTemplate = useCallback(async (templateId: string) => {
        try {
            setError(null);
            return await questionnaireService.getCategoriesByTemplate(templateId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error loading categories';
            setError(errorMessage);
            throw err;
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Cargar templates al montar o cuando cambie organizationId
    useEffect(() => {
        if (organizationId) {
            loadTemplates();
        }
    }, [organizationId, loadTemplates]);

    return {
        templates,
        loading,
        error,
        loadTemplates,
        createTemplate,
        deleteTemplate,
        updateTemplate,
        getTemplateWithQuestions,
        getCategoriesByTemplate,
        clearError
    };
}