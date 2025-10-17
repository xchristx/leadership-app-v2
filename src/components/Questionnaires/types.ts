// ============================================================================
// TIPOS PARA CUESTIONARIOS
// ============================================================================

export interface QuestionCategory {
    id: string;
    name: string;
    description?: string;
    color?: string;
    order_index: number;
}

export interface QuestionnaireFormData {
    // Información básica
    title_leader: string;
    title_collaborator: string;
    description_leader?: string;
    description_collaborator?: string;

    // Configuración
    version_type: 'leader' | 'collaborator' | 'both';
    is_active: boolean;

    // Categorías (opcional)
    categories: QuestionCategory[];
    use_categories: boolean;

    // Preguntas
    questions: QuestionFormData[];
}

export interface QuestionFormData {
    id?: string;
    text_leader: string;
    text_collaborator: string;
    category_id?: string;
    order_index: number;
    question_type: 'likert' | 'text' | 'multiple_choice';
    response_config: {
        scale?: number;
        scale_labels?: string[];
        options?: string[];
        min_label?: string;
        max_label?: string;
    };
    is_active: boolean;
}

export type QuestionType = 'likert' | 'text' | 'multiple_choice';

export interface ScaleConfig {
    scale: number;
    min_label: string;
    max_label: string;
    labels?: string[];
}