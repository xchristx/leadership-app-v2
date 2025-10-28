// ============================================================================
// HOOK USE COMPARATIVE ANALYSIS
// ============================================================================
// Hook personalizado para cargar y procesar datos del análisis comparativo
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type {
    DatabaseQuestion,
    ComparativeData,
    CategoryData,
    CategorySummary,
    AnalysisMetrics,
    CategoryQuestionDB
} from './types';

export function useComparativeAnalysis(teamId: string, isOpen: boolean) {
    const [comparativeData, setComparativeData] = useState<ComparativeData[]>([]);
    const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
    const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
    const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);
    const [loading, setLoading] = useState(false);

    const loadComparativeData = useCallback(async () => {
        setLoading(true);
        try {
            // Obtener evaluaciones completas del equipo
            const { data: evaluations, error: evalError } = await supabase
                .from('evaluations')
                .select(
                    `
          id,
          evaluator_role,
          responses_data,
          teams!inner(
            projects!inner(
              question_templates!inner(
                questions(*)
              )
            )
          )
        `
                )
                .eq('team_id', teamId)
                .eq('is_complete', true)
                .not('responses_data', 'is', null);

            if (evalError) throw evalError;

            if (!evaluations || evaluations.length === 0) {
                setComparativeData([]);
                setCategoryData([]);
                setCategorySummary([]);
                setMetrics(null);
                return;
            }

            // Procesar datos
            const evalWithRelations = evaluations[0] as {
                teams?: {
                    projects?: {
                        question_templates?: {
                            questions?: DatabaseQuestion[];
                        };
                    };
                };
            };
            const questions = evalWithRelations?.teams?.projects?.question_templates?.questions || [];

            const comparative: ComparativeData[] = [];
            const categoryMap = new Map<string, CategoryData>();

            for (const question of questions) {
                if (question.question_type !== 'likert') continue;

                const leaderResponses: number[] = [];
                const collaboratorResponses: number[] = [];
                const supervisorResponses: number[] = [];

                evaluations.forEach(evaluation => {
                    const role = evaluation.evaluator_role;
                    const responses: Record<string, unknown> = {};

                    try {
                        if (evaluation.responses_data) {
                            const jsonData =
                                typeof evaluation.responses_data === 'string'
                                    ? JSON.parse(evaluation.responses_data)
                                    : evaluation.responses_data;

                            if (jsonData && typeof jsonData === 'object' && 'responses' in jsonData) {
                                const responsesData = jsonData.responses as Record<string, unknown>;
                                Object.entries(responsesData).forEach(([questionId, responseData]) => {
                                    if (responseData && typeof responseData === 'object' && 'value' in responseData) {
                                        responses[questionId] = (responseData as { value: unknown }).value;
                                    }
                                });
                            }
                        }
                    } catch (error) {
                        console.warn('Error parsing responses_data:', error);
                    }

                    const responseValue = responses[question.id];
                    if (typeof responseValue === 'number') {
                        if (role === 'leader') {
                            leaderResponses.push(responseValue);
                        } else if (role === 'supervisor') {
                            supervisorResponses.push(responseValue);
                        } else {
                            collaboratorResponses.push(responseValue);
                        }
                    }
                });

                if (leaderResponses.length > 0 || collaboratorResponses.length > 0 || supervisorResponses.length > 0) {
                    const leaderAvg = leaderResponses.length > 0
                        ? leaderResponses.reduce((sum, val) => sum + val, 0) / leaderResponses.length
                        : 0;
                    const collaboratorsAvg = collaboratorResponses.length > 0
                        ? collaboratorResponses.reduce((sum, val) => sum + val, 0) / collaboratorResponses.length
                        : 0;
                    const supervisorsAvg = supervisorResponses.length > 0
                        ? supervisorResponses.reduce((sum, val) => sum + val, 0) / supervisorResponses.length
                        : 0;

                    // Agregar a datos comparativos generales
                    comparative.push({
                        question_id: question.id,
                        question_text: question.text_leader || question.text_collaborator || 'Pregunta sin texto',
                        leader_avg: leaderAvg,
                        collaborators_avg: collaboratorsAvg,
                        supervisors_avg: supervisorsAvg,
                        leader_count: leaderResponses.length,
                        collaborators_count: collaboratorResponses.length,
                        supervisors_count: supervisorResponses.length,
                        order_index: question.order_index || 0,
                    });

                    // Procesar por categorías
                    if (question.category) {
                        let categoryName = { name: 'Sin Categoría', id: 'no-category', color: "#fff", description: '' } as CategoryQuestionDB;

                        // Parsear la categoría que viene como JSON
                        try {
                            const categoryData = typeof question.category === 'string'
                                ? JSON.parse(question.category)
                                : question.category;

                            if (categoryData && typeof categoryData === 'object') {
                                categoryName = (categoryData as CategoryQuestionDB);
                            }

                        } catch (error) {
                            console.warn('Error parsing category data:', error);
                        }

                        if (!categoryMap.has(categoryName.id)) {
                            categoryMap.set(categoryName.id, {
                                category: categoryName,
                                leader_total: 0,
                                collaborator_total: 0,
                                supervisor_total: 0,
                                questions: [],
                            });
                        }

                        const cat = categoryMap.get(categoryName.id)!;
                        cat.leader_total += leaderAvg;
                        cat.collaborator_total += collaboratorsAvg;
                        cat.supervisor_total += supervisorsAvg;
                        cat.questions.push({
                            question_id: question.id,
                            question_text: question.text_leader || question.text_collaborator || 'Pregunta sin texto',
                            question_number: question.order_index + 1,
                            leader_avg: leaderAvg,
                            collaborator_avg: collaboratorsAvg,
                            supervisor_avg: supervisorsAvg,
                            leader_responses: leaderResponses,
                            collaborator_responses: collaboratorResponses,
                            supervisor_responses: supervisorResponses,
                            average_collaborator: collaboratorsAvg,
                        });
                    }
                }
            }

            // Ordenar datos comparativos
            comparative.sort((a, b) => a.order_index - b.order_index);
            setComparativeData(comparative);

            // Procesar datos de categorías
            const processedCategoryData = Array.from(categoryMap.values()).sort((a, b) => a.category.order_index - b.category.order_index);
            processedCategoryData.forEach(cat => {
                cat.questions.sort((a, b) => a.question_number - b.question_number);
            });
            setCategoryData(processedCategoryData);

            // Crear resumen de categorías
            const summary = processedCategoryData.map(cat => ({
                category: cat.category.name,
                auto_total: cat.leader_total,
                otros_total: cat.collaborator_total,
                supervisor_total: cat.supervisor_total,
            }));
            setCategorySummary(summary);

            // Calcular métricas
            if (comparative.length > 0) {
                const differences = comparative.map(d => Math.abs(d.leader_avg - d.collaborators_avg));
                const significantCount = differences.filter(d => d >= 1.5).length;
                const moderateCount = differences.filter(d => d >= 0.8 && d < 1.5).length;
                const alignedCount = differences.filter(d => d < 0.8).length;

                const leaderAvgAll = comparative.reduce((sum, d) => sum + d.leader_avg, 0) / comparative.length;
                const collaboratorAvgAll = comparative.reduce((sum, d) => sum + d.collaborators_avg, 0) / comparative.length;
                const supervisorAvgAll = comparative.reduce((sum, d) => sum + d.supervisors_avg, 0) / comparative.length;

                setMetrics({
                    total_questions: comparative.length,
                    significant_differences: significantCount,
                    moderate_differences: moderateCount,
                    aligned_questions: alignedCount,
                    average_alignment: differences.reduce((sum, d) => sum + d, 0) / differences.length,
                    leader_trend: leaderAvgAll > 3.5 ? 'positive' : leaderAvgAll < 2.5 ? 'negative' : 'neutral',
                    collaborator_trend: collaboratorAvgAll > 3.5 ? 'positive' : collaboratorAvgAll < 2.5 ? 'negative' : 'neutral',
                    supervisor_trend: supervisorAvgAll > 3.5 ? 'positive' : supervisorAvgAll < 2.5 ? 'negative' : 'neutral',
                    overall_satisfaction: (leaderAvgAll + collaboratorAvgAll + supervisorAvgAll) / 3,
                });
            }
        } catch (error) {
            console.error('Error loading comparative data:', error);
            setComparativeData([]);
            setCategoryData([]);
            setCategorySummary([]);
            setMetrics(null);
        } finally {
            setLoading(false);
        }
    }, [teamId]);

    useEffect(() => {
        if (isOpen && teamId) {
            loadComparativeData();
        }
    }, [isOpen, teamId, loadComparativeData]);

    return {
        comparativeData,
        categoryData,
        categorySummary,
        metrics,
        loading,
    };
}