// ============================================================================
// SERVICIO DE CUESTIONARIOS
// ============================================================================
// Manejo de templates de cuestionarios y preguntas con Supabase
// ============================================================================

import { supabase } from '../lib/supabase';
import type { QuestionnaireFormData } from '../components/Questionnaires';
import type { Database, Json } from '../types/database.types';

type QuestionTemplate = Database['public']['Tables']['question_templates']['Row'];
type QuestionInsert = Database['public']['Tables']['questions']['Insert'];
type QuestionTemplateInsert = Database['public']['Tables']['question_templates']['Insert'];

// Tipo para las categorías que se guardarán en JSON
interface CategoryData {
    id: string;
    name: string;
    description?: string;
    color?: string;
}

export const questionnaireService = {
    // Crear template de cuestionario con preguntas
    async createQuestionnaire(formData: QuestionnaireFormData & { organizationId: string }): Promise<string> {
        try {
            // 1. Crear el template principal
            const templateData: QuestionTemplateInsert = {
                title: formData.title_leader,
                description: formData.description_leader || formData.description_collaborator || null,
                organization_id: formData.organizationId,
                is_active: formData.is_active
            };

            const { data: template, error: templateError } = await supabase
                .from('question_templates')
                .insert(templateData)
                .select()
                .single();

            if (templateError) throw templateError;

            // 2. Crear mapeo de categorías (ahora se guardan como objetos JSON completos)
            const categoryDataMap: Record<string, CategoryData> = {};

            if (formData.categories && formData.categories.length > 0) {
                formData.categories.forEach((category) => {
                    categoryDataMap[category.id] = {
                        id: category.id,
                        name: category.name,
                        description: category.description || '',
                        color: '#1976d2' // Color por defecto
                    };
                });
            }

            // 3. Crear las preguntas con los objetos de categoría completos
            const questionsToInsert: QuestionInsert[] = formData.questions.map((question, index) => ({
                template_id: template.id,
                text_leader: question.text_leader,
                text_collaborator: question.text_collaborator,
                question_type: question.question_type,
                category: question.category_id ? (categoryDataMap[question.category_id] as unknown as Json) || null : null,
                order_index: question.order_index || index,
                response_config: question.response_config as Json,
                is_active: true
            })); const { error: questionsError } = await supabase
                .from('questions')
                .insert(questionsToInsert);

            if (questionsError) throw questionsError;

            return template.id;
        } catch (error) {
            console.error('Error creating questionnaire:', error);
            throw error;
        }
    },

    // Obtener templates disponibles
    async getTemplates(organizationId: string): Promise<QuestionTemplate[]> {
        const { data, error } = await supabase
            .from('question_templates')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // Obtener template con preguntas y categorías
    async getTemplateWithQuestions(templateId: string) {
        const [templateResult, questionsResult] = await Promise.all([
            supabase
                .from('question_templates')
                .select('*')
                .eq('id', templateId)
                .single(),

            supabase
                .from('questions')
                .select('*')
                .eq('template_id', templateId)
                .eq('is_active', true)
                .order('order_index')
        ]);

        if (templateResult.error) throw templateResult.error;
        if (questionsResult.error) throw questionsResult.error;

        // Extraer categorías únicas de las preguntas (ahora son objetos JSON)
        const uniqueCategories = new Map<string, CategoryData>();

        questionsResult.data?.forEach(question => {
            if (question.category) {
                try {
                    const categoryData = question.category as unknown as CategoryData;
                    if (categoryData && categoryData.id) {
                        uniqueCategories.set(categoryData.id, categoryData);
                    }
                } catch (error) {
                    console.warn('Error parsing category JSON:', error);
                }
            }
        });

        // Convertir el Map a array
        const categories = Array.from(uniqueCategories.values());

        console.log({ templateResult, questionsResult, categories });

        return {
            template: templateResult.data,
            questions: questionsResult.data || [],
            categories: categories
        };
    },

    // Contar preguntas de un template
    async getTemplateQuestionsCount(templateId: string): Promise<number> {
        const { count, error } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', templateId)
            .eq('is_active', true);

        if (error) throw error;
        return count || 0;
    },

    // Eliminar template (soft delete)
    async deleteTemplate(templateId: string): Promise<void> {
        // Primero desactivar las preguntas
        await supabase
            .from('questions')
            .update({ is_active: false })
            .eq('template_id', templateId);

        // Luego desactivar el template
        const { error } = await supabase
            .from('question_templates')
            .update({ is_active: false })
            .eq('id', templateId);

        if (error) throw error;
    },

    // Actualizar template
    async updateTemplate(templateId: string, updates: Partial<QuestionTemplateInsert>): Promise<void> {
        const { error } = await supabase
            .from('question_templates')
            .update(updates)
            .eq('id', templateId);

        if (error) throw error;
    },

    // Actualizar cuestionario completo
    async updateQuestionnaire(
        templateId: string,
        formData: QuestionnaireFormData & { organizationId: string }
    ): Promise<void> {
        try {
            // 1. Actualizar el template
            const templateUpdates: Partial<QuestionTemplateInsert> = {
                title: formData.title_leader,
                description: formData.description_leader || formData.description_collaborator || null,
            };

            await this.updateTemplate(templateId, templateUpdates);

            // 2. Desactivar preguntas existentes
            await supabase
                .from('questions')
                .update({ is_active: false })
                .eq('template_id', templateId);

            // 3. Crear mapeo de categorías (ahora se guardan como objetos JSON completos)
            const categoryDataMap: Record<string, CategoryData> = {};

            if (formData.categories && formData.categories.length > 0) {
                formData.categories.forEach((category) => {
                    categoryDataMap[category.id] = {
                        id: category.id,
                        name: category.name,
                        description: category.description || '',
                        color: '#1976d2' // Color por defecto
                    };
                });
            }

            // 4. Crear nuevas preguntas con objetos de categoría completos
            const questionsToInsert: QuestionInsert[] = formData.questions.map((question, index) => ({
                template_id: templateId,
                text_leader: question.text_leader,
                text_collaborator: question.text_collaborator,
                question_type: question.question_type,
                category: question.category_id ? (categoryDataMap[question.category_id] as unknown as Json) || null : null,
                order_index: question.order_index || index,
                response_config: question.response_config as Json,
                is_active: true
            })); const { error: questionsError } = await supabase
                .from('questions')
                .insert(questionsToInsert);

            if (questionsError) throw questionsError;

        } catch (error) {
            console.error('Error updating questionnaire:', error);
            throw error;
        }
    },

    // Obtener categorías de un template específico
    async getCategoriesByTemplate(templateId: string) {
        const { data, error } = await supabase
            .from('questions')
            .select('category')
            .eq('template_id', templateId)
            .eq('is_active', true)
            .not('category', 'is', null);

        if (error) throw error;

        // Extraer categorías únicas (ahora son objetos JSON)
        const uniqueCategories = new Map<string, CategoryData>();

        data?.forEach(question => {
            if (question.category) {
                try {
                    const categoryData = question.category as unknown as CategoryData;
                    if (categoryData && categoryData.id) {
                        uniqueCategories.set(categoryData.id, categoryData);
                    }
                } catch (error) {
                    console.warn('Error parsing category JSON:', error);
                }
            }
        });

        return Array.from(uniqueCategories.values());
    },

    // Método de diagnóstico y bypass temporal
    async debugAndCreateQuestionnaire(formData: QuestionnaireFormData & { organizationId: string }): Promise<string> {
        try {
            // 1. Verificar usuario actual
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                throw new Error('Usuario no autenticado: ' + (userError?.message || 'No user found'));
            }

            console.log('Authenticated user ID:', user.id);

            // 2. Verificar perfil del usuario
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error getting user profile:', profileError);
                throw new Error(`Error obteniendo perfil: ${profileError.message}`);
            }

            if (!profile) {
                throw new Error('No se encontró perfil de usuario. Debes tener un perfil válido para crear cuestionarios.');
            }

            console.log('User profile:', profile);

            if (!profile.organization_id) {
                throw new Error('El usuario no tiene una organización asignada. Contacta al administrador.');
            }

            // 3. Verificar que la organización coincida
            if (profile.organization_id !== formData.organizationId) {
                throw new Error(`Mismatch de organización: perfil=${profile.organization_id}, form=${formData.organizationId}`);
            }

            // 4. Proceder con la creación
            return await this.createQuestionnaire(formData);

        } catch (error) {
            console.error('Error in debugAndCreateQuestionnaire:', error);
            throw error;
        }
    }
};