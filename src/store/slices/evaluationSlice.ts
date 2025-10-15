// ============================================================================
// SLICE DE EVALUACIÓN PÚBLICA
// ============================================================================
// Estado para el flujo de evaluación pública (sin autenticación)
// ============================================================================

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Evaluation, Question, EvaluationResponse } from '../../types'

export interface PublicEvaluationState {
    // Evaluación actual
    evaluation: Evaluation | null
    questions: Question[]

    // Respuestas del usuario
    responses: Record<string, EvaluationResponse>

    // Control de flujo
    currentStep: number
    totalSteps: number
    isComplete: boolean

    // Estados
    isLoading: boolean
    isSubmitting: boolean
    error: string | null

    // Validación
    validationErrors: Record<string, string>
}

const initialState: PublicEvaluationState = {
    evaluation: null,
    questions: [],
    responses: {},
    currentStep: 0,
    totalSteps: 0,
    isComplete: false,
    isLoading: false,
    isSubmitting: false,
    error: null,
    validationErrors: {}
}

export const evaluationSlice = createSlice({
    name: 'evaluation',
    initialState,
    reducers: {
        // Establecer evaluación
        setEvaluation: (state, action: PayloadAction<{ evaluation: Evaluation; questions: Question[] }>) => {
            state.evaluation = action.payload.evaluation
            state.questions = action.payload.questions
            state.totalSteps = action.payload.questions.length
            state.currentStep = 0
            state.responses = {}
            state.isComplete = false
            state.error = null
            state.validationErrors = {}
        },

        // Navegación entre pasos
        nextStep: (state) => {
            if (state.currentStep < state.totalSteps - 1) {
                state.currentStep += 1
            }
        },

        previousStep: (state) => {
            if (state.currentStep > 0) {
                state.currentStep -= 1
            }
        },

        goToStep: (state, action: PayloadAction<number>) => {
            if (action.payload >= 0 && action.payload < state.totalSteps) {
                state.currentStep = action.payload
            }
        },

        // Respuestas
        setResponse: (state, action: PayloadAction<{ questionId: string; response: EvaluationResponse }>) => {
            state.responses[action.payload.questionId] = action.payload.response

            // Limpiar error de validación para esta pregunta
            if (state.validationErrors[action.payload.questionId]) {
                delete state.validationErrors[action.payload.questionId]
            }
        },

        updateResponse: (state, action: PayloadAction<{ questionId: string; updates: Partial<EvaluationResponse> }>) => {
            const existing = state.responses[action.payload.questionId]
            if (existing) {
                state.responses[action.payload.questionId] = {
                    ...existing,
                    ...action.payload.updates
                }
            }
        },

        // Estados de carga
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload
        },

        setSubmitting: (state, action: PayloadAction<boolean>) => {
            state.isSubmitting = action.payload
        },

        // Errores
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload
        },

        setValidationErrors: (state, action: PayloadAction<Record<string, string>>) => {
            state.validationErrors = action.payload
        },

        clearValidationError: (state, action: PayloadAction<string>) => {
            delete state.validationErrors[action.payload]
        },

        // Completar evaluación
        setComplete: (state, action: PayloadAction<boolean>) => {
            state.isComplete = action.payload
        },

        // Reiniciar estado
        reset: (state) => {
            Object.assign(state, initialState)
        }
    }
})

// Acciones exportadas
export const {
    setEvaluation,
    nextStep,
    previousStep,
    goToStep,
    setResponse,
    updateResponse,
    setLoading,
    setSubmitting,
    setError,
    setValidationErrors,
    clearValidationError,
    setComplete,
    reset
} = evaluationSlice.actions

// Selectores
export const selectEvaluation = (state: { evaluation: PublicEvaluationState }) => state.evaluation
export const selectCurrentEvaluation = (state: { evaluation: PublicEvaluationState }) => state.evaluation.evaluation
export const selectQuestions = (state: { evaluation: PublicEvaluationState }) => state.evaluation.questions
export const selectCurrentQuestion = (state: { evaluation: PublicEvaluationState }) => {
    const { questions, currentStep } = state.evaluation
    return questions[currentStep] || null
}
export const selectResponses = (state: { evaluation: PublicEvaluationState }) => state.evaluation.responses
export const selectCurrentStep = (state: { evaluation: PublicEvaluationState }) => state.evaluation.currentStep
export const selectProgress = (state: { evaluation: PublicEvaluationState }) => {
    const { currentStep, totalSteps } = state.evaluation
    return totalSteps > 0 ? (currentStep + 1) / totalSteps : 0
}
export const selectIsComplete = (state: { evaluation: PublicEvaluationState }) => state.evaluation.isComplete
export const selectValidationErrors = (state: { evaluation: PublicEvaluationState }) => state.evaluation.validationErrors