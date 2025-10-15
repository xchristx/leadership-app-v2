// ============================================================================
// HOOK DE EVALUACIONES
// ============================================================================
// Hook personalizado para gestionar evaluaciones con caché RTK Query
// ============================================================================

import { useCallback } from 'react'
import {
    useGetEvaluationsQuery
} from '../store/api/supabaseApi'
import {
    useAppDispatch,
    useAppSelector
} from '../store/hooks'
import {
    nextStep,
    previousStep,
    goToStep,
    setResponse,
    setComplete,
    reset,
    selectEvaluation,
    selectCurrentQuestion,
    selectProgress,
    selectResponses
} from '../store/slices/evaluationSlice'
// Tipos para filtros de evaluación
interface EvaluationFilters {
    projectId?: string
    teamId?: string
    status?: string
    evaluatorId?: string
}

export function useEvaluations(filters: EvaluationFilters = {}) {
    // Query para obtener evaluaciones
    const {
        data: evaluations = [],
        isLoading,
        isError,
        error,
        refetch
    } = useGetEvaluationsQuery(filters)

    // Estadísticas derivadas
    const stats = {
        total: evaluations.length,
        active: evaluations.filter(e => e.is_complete === false).length,
        completed: evaluations.filter(e => e.is_complete === true).length,
        draft: evaluations.length
    }

    return {
        // Datos
        evaluations,
        stats,

        // Estados
        isLoading,
        isError,
        error,

        // Acciones
        refetch
    }
}

// Hook para evaluación pública
export function usePublicEvaluation(token: string) {
    const dispatch = useAppDispatch()
    const evaluationState = useAppSelector(selectEvaluation)
    const currentQuestion = useAppSelector(selectCurrentQuestion)
    const progress = useAppSelector(selectProgress)
    const responses = useAppSelector(selectResponses)

    // Query para obtener evaluación pública (placeholder - TODO: implementar)
    const isLoadingEvaluation = false
    const isError = false
    const error = null

    // Mutación para enviar evaluación
    const isSubmitting = false // TODO: Implementar estado de submitting

    // Inicializar evaluación cuando se carga (TODO: implementar cuando haya datos)
    // useCallback(() => {
    //     if (evaluation && evaluation.questions) {
    //         dispatch(setEvaluation({
    //             evaluation,
    //             questions: evaluation.questions
    //         }))
    //     }
    // }, [evaluation, dispatch])()

    // Navegación
    const handleNextStep = useCallback(() => {
        dispatch(nextStep())
    }, [dispatch])

    const handlePreviousStep = useCallback(() => {
        dispatch(previousStep())
    }, [dispatch])

    const handleGoToStep = useCallback((step: number) => {
        dispatch(goToStep(step))
    }, [dispatch])

    // Respuestas
    const handleSetResponse = useCallback((questionId: string, responseValue: unknown) => {
        // Crear un objeto EvaluationResponse básico para compatibilidad
        const response = {
            id: `temp-${Date.now()}`,
            evaluation_id: evaluationState.evaluation?.id || '',
            question_id: questionId,
            response_value: typeof responseValue === 'number' ? responseValue : undefined,
            response_text: typeof responseValue === 'string' ? responseValue : undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
        dispatch(setResponse({ questionId, response }))
    }, [dispatch, evaluationState.evaluation?.id])

    // Enviar evaluación (placeholder)
    const submitEvaluation = useCallback(async () => {
        try {
            if (!token) {
                throw new Error('Token is required')
            }

            // TODO: Implementar envío de evaluación
            console.log('Enviando evaluación con responses:', responses)

            dispatch(setComplete(true))
            return { success: true }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error submitting evaluation'
            return { success: false, error: errorMessage }
        }
    }, [token, responses, dispatch])

    // Reiniciar evaluación
    const resetEvaluation = useCallback(() => {
        dispatch(reset())
    }, [dispatch])

    // Validación de paso actual
    const canContinue = useCallback(() => {
        if (!currentQuestion) return false
        const response = responses[currentQuestion.id]
        return response && response.response_value !== undefined && response.response_value !== null
    }, [currentQuestion, responses])

    return {
        // Datos
        evaluation: evaluationState.evaluation,
        questions: evaluationState.questions,
        currentQuestion,
        responses,

        // Estado de navegación
        currentStep: evaluationState.currentStep,
        totalSteps: evaluationState.totalSteps,
        progress,
        canContinue: canContinue(),

        // Estados
        isLoading: isLoadingEvaluation || evaluationState.isLoading,
        isSubmitting: isSubmitting || evaluationState.isSubmitting,
        isComplete: evaluationState.isComplete,
        isError,
        error: error || evaluationState.error,
        validationErrors: evaluationState.validationErrors,

        // Acciones de navegación
        nextStep: handleNextStep,
        previousStep: handlePreviousStep,
        goToStep: handleGoToStep,

        // Acciones de respuesta
        setResponse: handleSetResponse,

        // Acciones de evaluación
        submitEvaluation,
        resetEvaluation
    }
}