// ============================================================================
// TIPOS DE DATOS PARA ANÁLISIS COMPARATIVO
// ============================================================================
// Interfaces compartidas para el análisis comparativo de evaluaciones
// ============================================================================


export interface DatabaseQuestion {
    id: string;
    question_type: string | null;
    text_leader: string;
    text_collaborator: string;
    order_index: number;
    category: unknown; // Json type from database
}

export interface ComparativeData {
    question_id: string;
    question_text: string;
    leader_avg: number;
    collaborators_avg: number;
    leader_count: number;
    collaborators_count: number;
    order_index: number;
}

export interface CategoryQuestion {
    question_id: string;
    question_text: string;
    question_number: number;
    leader_avg: number;
    collaborator_avg: number;
    leader_responses: number[];
    collaborator_responses: number[];
    average_collaborator: number;
}

export interface CategoryQuestionDB {
    name: string,
    color: string,
    id: string,
    description: string
}

export interface CategoryData {
    category: CategoryQuestionDB;
    leader_total: number;
    collaborator_total: number;
    questions: CategoryQuestion[];
}

export interface CategorySummary {
    category: string;
    auto_total: number;
    otros_total: number;
}

export interface AnalysisMetrics {
    total_questions: number;
    significant_differences: number;
    moderate_differences: number;
    aligned_questions: number;
    average_alignment: number;
    leader_trend: 'positive' | 'negative' | 'neutral';
    collaborator_trend: 'positive' | 'negative' | 'neutral';
    overall_satisfaction: number;
}

export interface ChartData {
    alignment: Array<{
        name: string;
        value: number;
        color: string;
    }>;
    trends: Array<{
        question: string;
        leader: number;
        collaborator: number;
        difference: number;
    }>;
}

export interface ComparativeAnalysisDialogProps {
    open: boolean;
    onClose: () => void;
    teamId: string;
    teamName?: string;
}

export interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}