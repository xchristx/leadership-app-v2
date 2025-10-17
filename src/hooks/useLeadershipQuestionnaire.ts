// ============================================================================
// HOOK: useLeadershipQuestionnaire
// ============================================================================
// Hook personalizado para manejar la creación del cuestionario de liderazgo
// Solo crea el cuestionario una vez por organización
// ============================================================================

import { useState } from 'react';
import { questionnaireService } from '../services/questionnaireService';
import { useAuth } from './useAuth';

interface UseLeadershipQuestionnaireReturn {
    questionnaireId: string | null;
    isCreating: boolean;
    error: string | null;
    createQuestionnaire: () => Promise<void>;
    hasQuestionnaire: boolean;
}

export const useLeadershipQuestionnaire = (): UseLeadershipQuestionnaireReturn => {
    const { profile } = useAuth();
    const [questionnaireId, setQuestionnaireId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createQuestionnaire = async () => {
        if (!profile?.organization_id) {
            setError('No se encontró ID de organización');
            return;
        }

        if (isCreating) {
            console.log('⏳ Creación ya en progreso...');
            return;
        }

        try {
            setIsCreating(true);
            setError(null);

            console.log('🚀 Iniciando creación/verificación del cuestionario de liderazgo...');

            const id = await questionnaireService.createLeadershipInventoryQuestionnaireOnce(
                profile.organization_id
            );

            setQuestionnaireId(id);
            console.log('✅ Cuestionario de liderazgo listo:', id);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            console.error('❌ Error creando cuestionario:', err);
        } finally {
            setIsCreating(false);
        }
    };

    return {
        questionnaireId,
        isCreating,
        error,
        createQuestionnaire,
        hasQuestionnaire: questionnaireId !== null
    };
};