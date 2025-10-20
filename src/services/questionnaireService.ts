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
    order_index?: number;
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
                is_active: formData.is_active,
                categories: (formData.categories as unknown as Json) || null
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
                        color: '#1976d2', // Color por defecto
                        order_index: category.order_index
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

    // Eliminar template (eliminación física)
    async deleteTemplate(templateId: string): Promise<void> {
        // Primero eliminar las preguntas
        const { error: questionsError } = await supabase
            .from('questions')
            .delete()
            .eq('template_id', templateId);

        if (questionsError) {
            console.error('Error deleting questions:', questionsError);
            throw questionsError;
        }

        // Luego eliminar el template
        const { error: templateError } = await supabase
            .from('question_templates')
            .delete()
            .eq('id', templateId);

        if (templateError) {
            console.error('Error deleting template:', templateError);
            throw templateError;
        }
    },

    // Actualizar template
    async updateTemplate(templateId: string, updates: Partial<QuestionTemplateInsert>): Promise<void> {
        const { error } = await supabase
            .from('question_templates')
            .update(updates)
            .eq('id', templateId);

        if (error) throw error;
    },

    // Actualizar cuestionario completo (método alternativo con timestamps)
    async updateQuestionnaireWithTimestamp(
        templateId: string,
        formData: QuestionnaireFormData & { organizationId: string }
    ): Promise<void> {
        try {
            console.log('🔄 Iniciando actualización de cuestionario con timestamps:', templateId);
            const timestamp = Date.now();

            // 1. Actualizar el template
            const templateUpdates: Partial<QuestionTemplateInsert> = {
                title: formData.title_leader,
                description: formData.description_leader || formData.description_collaborator || null,
                categories: (formData.categories as unknown as Json) || null
            };

            await this.updateTemplate(templateId, templateUpdates);

            // 2. Obtener y modificar order_index existente para evitar conflicto
            const { data: existingQuestions } = await supabase
                .from('questions')
                .select('id, order_index')
                .eq('template_id', templateId);

            if (existingQuestions && existingQuestions.length > 0) {
                // Actualizar cada pregunta con un order_index temporal único
                for (const question of existingQuestions) {
                    await supabase
                        .from('questions')
                        .update({ order_index: question.order_index + timestamp })
                        .eq('id', question.id);
                }
            }

            // 3. Ahora eliminar las preguntas existentes
            const { data: deletedData, error: deleteError } = await supabase
                .from('questions')
                .delete()
                .eq('template_id', templateId)
                .select('id');

            if (deleteError) {
                console.error('Error deleting existing questions:', deleteError);
                throw deleteError;
            }

            console.log(`✅ Preguntas eliminadas: ${deletedData?.length || 0}`);

            // 4. Crear mapeo de categorías
            const categoryDataMap: Record<string, CategoryData> = {};
            if (formData.categories && formData.categories.length > 0) {
                formData.categories.forEach((category) => {
                    categoryDataMap[category.id] = {
                        id: category.id,
                        name: category.name,
                        description: category.description || '',
                        color: category.color || '#1976d2'
                    };
                });
            }

            // 5. Insertar nuevas preguntas
            const questionsToInsert: QuestionInsert[] = formData.questions.map((question, index) => ({
                template_id: templateId,
                text_leader: question.text_leader,
                text_collaborator: question.text_collaborator,
                question_type: question.question_type,
                category: question.category_id ? (categoryDataMap[question.category_id] as unknown as Json) || null : null,
                order_index: index,
                response_config: question.response_config as Json,
                is_active: true
            }));

            const { data: insertedData, error: questionsError } = await supabase
                .from('questions')
                .insert(questionsToInsert)
                .select('id');

            if (questionsError) {
                console.error('Error inserting new questions:', questionsError);
                throw questionsError;
            }

            console.log(`✅ ${insertedData?.length || 0} nuevas preguntas insertadas exitosamente`);

        } catch (error) {
            console.error('❌ Error updating questionnaire with timestamp:', error);
            throw error;
        }
    },

    // Actualizar cuestionario completo (MÉTODO CORRECTO: UPDATE + INSERT + DELETE selectivo)
    async updateQuestionnaire(
        templateId: string,
        formData: QuestionnaireFormData & { organizationId: string }
    ): Promise<void> {
        try {
            console.log('🔄 Iniciando actualización inteligente de cuestionario:', templateId);

            // 1. Actualizar el template
            const templateUpdates: Partial<QuestionTemplateInsert> = {
                title: formData.title_leader,
                description: formData.description_leader || formData.description_collaborator || null,
                categories: (formData.categories as unknown as Json) || null
            };

            await this.updateTemplate(templateId, templateUpdates);

            // 2. Obtener preguntas existentes
            const { data: existingQuestions, error: checkError } = await supabase
                .from('questions')
                .select('*')
                .eq('template_id', templateId)
                .order('order_index');

            if (checkError) {
                console.error('Error checking existing questions:', checkError);
                throw checkError;
            }

            const existingQuestionsMap = new Map(
                existingQuestions?.map(q => [q.id, q]) || []
            );

            console.log(`📋 Preguntas existentes: ${existingQuestions?.length || 0}`);

            // 3. Crear mapeo de categorías
            const categoryDataMap: Record<string, CategoryData> = {};
            if (formData.categories && formData.categories.length > 0) {
                formData.categories.forEach((category) => {
                    categoryDataMap[category.id] = {
                        id: category.id,
                        name: category.name,
                        description: category.description || '',
                        color: category.color || '#1976d2',
                        order_index: category.order_index || 0
                    };
                });
            }

            // 4. Clasificar operaciones: UPDATE, INSERT, DELETE
            const questionsToUpdate: Array<{ id: string, updates: Partial<QuestionInsert> }> = [];
            const questionsToInsert: QuestionInsert[] = [];
            const questionIdsInForm = new Set<string>();

            formData.questions.forEach((question, index) => {
                const questionData = {
                    template_id: templateId,
                    text_leader: question.text_leader,
                    text_collaborator: question.text_collaborator,
                    question_type: question.question_type,
                    category: question.category_id ? (categoryDataMap[question.category_id] as unknown as Json) || null : null,
                    order_index: index,
                    response_config: question.response_config as Json,
                    is_active: true
                };

                if (question.id && existingQuestionsMap.has(question.id)) {
                    // ACTUALIZAR pregunta existente
                    questionsToUpdate.push({
                        id: question.id,
                        updates: questionData
                    });
                    questionIdsInForm.add(question.id);
                } else {
                    // INSERTAR nueva pregunta
                    questionsToInsert.push(questionData);
                }
            });

            // 5. Identificar preguntas a ELIMINAR (las que no están en el form)
            const questionIdsToDelete = existingQuestions
                ?.filter(q => !questionIdsInForm.has(q.id))
                .map(q => q.id) || [];

            console.log(`🔄 Actualizaciones: ${questionsToUpdate.length}`);
            console.log(`➕ Inserciones: ${questionsToInsert.length}`);
            console.log(`🗑️ Eliminaciones: ${questionIdsToDelete.length}`);

            // 6. Ejecutar ACTUALIZACIONES
            for (const { id, updates } of questionsToUpdate) {
                const { error: updateError } = await supabase
                    .from('questions')
                    .update(updates)
                    .eq('id', id);

                if (updateError) {
                    console.error(`Error updating question ${id}:`, updateError);
                    throw updateError;
                }
            }

            // 7. Ejecutar INSERCIONES
            if (questionsToInsert.length > 0) {
                const { data: insertedData, error: insertError } = await supabase
                    .from('questions')
                    .insert(questionsToInsert)
                    .select('id');

                if (insertError) {
                    console.error('Error inserting new questions:', insertError);
                    throw insertError;
                }

                console.log(`✅ ${insertedData?.length || 0} preguntas insertadas`);
            }

            // 8. Ejecutar ELIMINACIONES
            if (questionIdsToDelete.length > 0) {
                const { data: deletedData, error: deleteError } = await supabase
                    .from('questions')
                    .delete()
                    .in('id', questionIdsToDelete)
                    .select('id');

                if (deleteError) {
                    console.error('Error deleting questions:', deleteError);
                    throw deleteError;
                }

                console.log(`✅ ${deletedData?.length || 0} preguntas eliminadas`);
            }

            console.log('✅ Cuestionario actualizado inteligentemente');

        } catch (error) {
            console.error('❌ Error updating questionnaire:', error);
            throw error;
        }
    },

    // Verificar si el template ya está siendo usado en evaluaciones
    async checkIfTemplateHasEvaluations(templateId: string): Promise<boolean> {
        try {
            // Verificar en la tabla evaluations si hay evaluaciones que usen este template
            const { data, error } = await supabase
                .from('evaluations')
                .select('id')
                .eq('template_id', templateId)
                .limit(1); // Solo necesitamos saber si existe al menos una

            if (error) {
                console.error('Error checking evaluations:', error);
                throw error;
            }

            const hasEvaluations = data && data.length > 0;
            console.log(`📊 Template ${templateId} ${hasEvaluations ? 'tiene' : 'no tiene'} evaluaciones`);

            return hasEvaluations;
        } catch (error) {
            console.error('Error checking if template has evaluations:', error);
            // En caso de error, asumir que tiene evaluaciones para ser conservador
            return true;
        }
    },

    // Crear nueva versión del template (preserva el original)
    async createNewTemplateVersion(
        originalTemplateId: string,
        formData: QuestionnaireFormData & { organizationId: string }
    ): Promise<{ newTemplateId: string; isNewVersion: boolean }> {
        try {
            console.log('🔄 Creando nueva versión del cuestionario:', originalTemplateId);

            // 1. Obtener el template original
            const { data: originalTemplate, error: templateError } = await supabase
                .from('question_templates')
                .select('*')
                .eq('id', originalTemplateId)
                .single();

            if (templateError || !originalTemplate) {
                throw new Error('No se pudo obtener el template original');
            }

            // 2. Crear mapeo de categorías
            const categoryDataMap: Record<string, CategoryData> = {};
            if (formData.categories && formData.categories.length > 0) {
                formData.categories.forEach((category) => {
                    categoryDataMap[category.id] = {
                        id: category.id,
                        name: category.name,
                        description: category.description || '',
                        color: category.color || '#1976d2',
                        order_index: category.order_index || 0
                    };
                });
            }

            // 3. Crear nuevo template con versioning
            const currentDate = new Date().toISOString().split('T')[0];
            const versionSuffix = ` (v${currentDate})`;

            const newTemplateData: QuestionTemplateInsert = {
                title: formData.title_leader + (formData.title_leader.includes('(v') ? '' : versionSuffix),
                description: formData.description_leader || formData.description_collaborator || null,
                organization_id: formData.organizationId,
                is_active: true,
                categories: (formData.categories as unknown as Json) || null
            };

            const { data: newTemplate, error: newTemplateError } = await supabase
                .from('question_templates')
                .insert(newTemplateData)
                .select()
                .single();

            if (newTemplateError || !newTemplate) {
                throw new Error('Error creando nueva versión del template');
            }

            // 4. Crear preguntas para la nueva versión
            const questionsToInsert: QuestionInsert[] = formData.questions.map((question, index) => ({
                template_id: newTemplate.id,
                text_leader: question.text_leader,
                text_collaborator: question.text_collaborator,
                question_type: question.question_type,
                category: question.category_id ? (categoryDataMap[question.category_id] as unknown as Json) || null : null,
                order_index: index,
                response_config: question.response_config as Json,
                is_active: true
            }));

            const { data: insertedQuestions, error: questionsError } = await supabase
                .from('questions')
                .insert(questionsToInsert)
                .select('id');

            if (questionsError) {
                // Si falla la inserción de preguntas, eliminar el template creado
                await supabase
                    .from('question_templates')
                    .delete()
                    .eq('id', newTemplate.id);

                throw questionsError;
            }

            console.log(`✅ Nueva versión creada: ${newTemplate.id} con ${insertedQuestions?.length || 0} preguntas`);

            return {
                newTemplateId: newTemplate.id,
                isNewVersion: true
            };

        } catch (error) {
            console.error('❌ Error creating new template version:', error);
            throw error;
        }
    },

    // Actualización inteligente: edita o crea nueva versión según sea necesario
    async updateQuestionnaireIntelligent(
        templateId: string,
        formData: QuestionnaireFormData & { organizationId: string }
    ): Promise<{ templateId: string; isNewVersion: boolean; message?: string }> {
        try {
            console.log('🧠 Iniciando actualización inteligente de cuestionario:', templateId);

            // 1. Verificar si el template ya está siendo usado en evaluaciones
            const hasEvaluations = await this.checkIfTemplateHasEvaluations(templateId);

            if (hasEvaluations) {
                // 2a. Crear nueva versión para preservar datos existentes
                console.log('📊 Template en uso - Creando nueva versión...');

                const result = await this.createNewTemplateVersion(templateId, formData);

                return {
                    templateId: result.newTemplateId,
                    isNewVersion: true,
                    message: 'Este cuestionario ya está siendo usado en evaluaciones. Se ha creado una nueva versión para preservar los datos existentes.'
                };

            } else {
                // 2b. Edición normal - no hay evaluaciones
                console.log('📝 Template sin usar - Actualizando directamente...');

                await this.updateQuestionnaire(templateId, formData);

                return {
                    templateId: templateId,
                    isNewVersion: false,
                    message: 'Cuestionario actualizado exitosamente.'
                };
            }

        } catch (error) {
            console.error('❌ Error in intelligent questionnaire update:', error);
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
    },

    // Crear el cuestionario específico "Inventario de Prácticas de Liderazgo"
    async createLeadershipInventoryQuestionnaire(organizationId: string): Promise<string> {
        const categories = [
            "cat_1760573578708",    // MODELAR EL CAMINO
            "cat_1760573593956",    // INSPIRAR UNA VISIÓN COMPARTIDA  
            "cat_1760573609580",    // DESAFIAR EL PROCESO
            "cat_1760573614485",    // CAPACITAR A OTROS PARA LA ACCIÓN
            "cat_1760573662454"     // ESTIMULAR EMOTIVAMENTE
        ];

        const leadershipQuestions = [
            { leader: "Demuestro con mi ejemplo lo que espero de los miembros de mi equipo.", collaborator: "Demuestra con su ejemplo lo que espera de los demás.", cat: categories[0] },
            { leader: "Hablo con mi equipo sobre las tendencias futuras de la organización y como estas podrían influenciar nuestro trabajo. Describo a los demás el futuro que me gustaría crear junto con ellos", collaborator: "Habla sobre las tendencias futuras de la Organización y como estas podrían influenciar el trabajo del equipo. Describo a los demás el futuro que me gustaría crear junto con ellos", cat: categories[1] },
            { leader: "Busco oportunidades desafiantes que ponen a prueba mis propias habilidades y habilidades.", collaborator: "Busca oportunidades desafiantes que ponen a prueba sus propias habilidades y habilidades.", cat: categories[2] },
            { leader: "Desarrollo relaciones de cooperación con los miembros de mi equipo.", collaborator: "Desarrolla relaciones de cooperación con el equipo de trabajo.", cat: categories[3] },
            { leader: "Elogio a la gente cuando hace un buen trabajo", collaborator: "Elogia a la gente cuando hace un buen trabajo", cat: categories[4] },
            { leader: "Gasto tiempo y energía para asegurarme que las personas cumplan los principios y estándares que hemos acordado.", collaborator: "Gasta tiempo y energía para asegurarse que los miembros del equipo cumplamos los principios y estándares que hemos acordado.", cat: categories[0] },
            { leader: "Describo a los miembros de mi equipo una imagen convincente del futuro que me gustaría crear junto a ellos", collaborator: "Suele dar una imagen convincente del futuro que le gustaría crear con el equipo de trabajo.", cat: categories[1] },
            { leader: "Incentivo y desafío a mis colaboradores para que busquen formas nuevas o innovadoras para hacer el trabajo", collaborator: "Nos incentiva y desafía para que busquemos formas nuevas o innovadoras de hacer el trabajo", cat: categories[2] },
            { leader: "Escucho activamente puntos de vista diferentes", collaborator: "Escucha activamente puntos de vista diferentes", cat: categories[3] },
            { leader: "Busco que el personal a mi cargo desarrolle confianza en sus propias habilidades y capacidades", collaborator: "Busca que el personal a su cargo desarrolle confianza en sus propias habilidades y capacidades", cat: categories[4] },
            { leader: "Cumplo las promesas y los compromisos que hago", collaborator: "Cumple las promesas y los compromisos que hace.", cat: categories[0] },
            { leader: "Demuestro motivación y entusiasmo contagioso sobre las posibilidades de futuro", collaborator: "Demuestra motivación y entusiasmo contagioso sobre las posibilidades de futuro", cat: categories[1] },
            { leader: "Busco maneras innovadoras que puedan mejorar los procesos actuales.", collaborator: "Busca maneras innovadoras que puedan mejorar los procesos actuales.", cat: categories[2] },
            { leader: "Trato con dignidad y respecto a los miembros de mi equipo.", collaborator: "Trata con dignidad y respecto a los demás", cat: categories[3] },
            { leader: "Me aseguro que mis colaboradores sean reconocidos por las contribuciones que realizan para el éxito del trabajo.", collaborator: "Se asegura que los miembros del equipo sean reconocidos por las contribuciones que realizan para el éxito del trabajo.", cat: categories[4] },
            { leader: "Pido que me den retroalimentación sobre cómo mis acciones afectan el rendimiento del equipo.", collaborator: "Pide retroalimentación sobre cómo sus acciones afectan el rendimiento del equipo.", cat: categories[0] },
            { leader: "Demuestro a los miembros de mi equipo como las metas a largo plazo se pueden realizar mediante el compromiso con una visión compartida.", collaborator: "Demuestra a los miembros del equipo como las metas a largo plazo se pueden realizar mediante el compromiso con una visión compartida.", cat: categories[1] },
            { leader: "Cuando las cosas no salen como esperábamos pregunto: ¿qué podemos aprender?", collaborator: "Cuando las cosas no salen como esperábamos pregunta: ¿qué podemos aprender?", cat: categories[2] },
            { leader: "Apoyo las decisiones que mis colaboradores toman por sí mismos.", collaborator: "Apoya las decisiones que los miembros del equipo toman por sí mismos.", cat: categories[3] },
            { leader: "Reconozco públicamente a los miembros de mi equipo que dan ejemplo de compromiso con los valores de la organización.", collaborator: "Reconoce públicamente a los miembros del equipo que dan ejemplo de compromiso con los valores de la organización.", cat: categories[4] },
            { leader: "Establezco consenso con el equipo sobre los valores que debemos seguir en la organización.", collaborator: "Establece consenso con el equipo sobre los valores que deben seguir en la organización.", cat: categories[0] },
            { leader: "Explico a mi personal el \"cuadro grande\" de lo que queremos alcanzar.", collaborator: "Explica al equipo el \"cuadro grande\" de lo que se quiere alcanzar.", cat: categories[1] },
            { leader: "Me aseguro que las personas que trabajan conmigo tengan claro los objetivos del trabajo, elaboren planes y establezcan metas para el trabajo", collaborator: "Se asegura que las personas del equipo tengan claro los objetivos del trabajo, elaboren planes y establezcan metas para el trabajo", cat: categories[2] },
            { leader: "Otorgo bastante libertad a mi personal para decidir sobre la forma en que quieren realizar su trabajo", collaborator: "Otorga bastante libertad al personal para decidir sobre la forma en que quieren realizar su trabajo", cat: categories[3] },
            { leader: "Celebro con el equipo las metas cumplidas", collaborator: "Celebra con el equipo las metas cumplidas", cat: categories[4] },
            { leader: "Estoy claro/a de cuál es mi filosofía de liderazgo", collaborator: "Todos conocemos cuál es su filosofía de liderazgo", cat: categories[0] },
            { leader: "Hablo con convicción sobre la trascendencia y el propósito del trabajo que hacemos", collaborator: "Habla con convicción sobre la trascendencia y el propósito del trabajo que hacemos", cat: categories[1] },
            { leader: "Experimento y me arriesgo con nuevos enfoques en el trabajo, a pesar de que haya la posibilidad de que fallen", collaborator: "Experimenta y se arriesgo con nuevos enfoques en el trabajo, a pesar de que haya la posibilidad de que fallen", cat: categories[2] },
            { leader: "Me aseguro de que mis colaboradores estén aprendiendo y desarrollando nuevas habilidades en el trabajo.", collaborator: "Se asegura de que sus colaboradores estén aprendiendo y desarrollando nuevas habilidades en el trabajo.", cat: categories[3] },
            { leader: "Demuestro mucho aprecio por el trabajo que hacen los miembros de mi equipo y doy soporte a las contribuciones hechas.", collaborator: "Demuestra mucho aprecio por el trabajo que hacen los miembros del equipo y da soporte a las contribuciones hechas.", cat: categories[4] }
        ];

        const formData: QuestionnaireFormData & { organizationId: string } = {
            title_leader: "DESARROLLO DE DESTREZAS DE DIRECCIÓN\nINVENTARIO DE PRÁCTICAS DE LIDERAZGO",
            title_collaborator: "DESARROLLO DE DESTREZAS DE DIRECCIÓN\nINVENTARIO DE PRÁCTICAS DE LIDERAZGO",
            description_leader: "POR FAVOR PIENSE EN CÓMO USTED SUELE ACTUAR GENERALMENTE EN EL TRABAJO Y COLOQUE LA FRECUENCIA CON LA QUE DEMUESTRA LOS COMPORTAMIENTOS ENUNCIADOS.\n\n1: Rara vez o Nunca\n2: De vez en cuando\n3: Algunas veces\n4: Con frecuencia\n5: Muy frecuentemente",
            description_collaborator: "POR FAVOR, PIENSE EN CÓMO SU LÍNEA DE SUPERVISIÓN SUELE ACTUAR GENERALMENTE EN EL TRABAJO Y COLOQUE LA FRECUENCIA CON LA QUE DEMUESTRA LOS COMPORTAMIENTOS ENUNCIADOS.\nNOMBRE DE SU LÍNEA DE SUPERVISIÓN: \n\n1: Rara vez\n2: De vez en cuando\n3: Algunas veces\n4: Con frecuencia\n5: Muy frecuentemente",
            version_type: 'both',
            is_active: true,
            use_categories: true,
            organizationId,
            categories: [
                {
                    "id": "cat_1760573578708",
                    "name": "MODELAR EL CAMINO",
                    "color": "#1976d2",
                    "order_index": 0
                },
                {
                    "id": "cat_1760573593956",
                    "name": "INSPIRAR UNA VISIÓN COMPARTIDA",
                    "color": "#388e3c",
                    "order_index": 1
                },
                {
                    "id": "cat_1760573609580",
                    "name": "DESAFIAR EL PROCESO",
                    "color": "#f57c00",
                    "order_index": 2
                },
                {
                    "id": "cat_1760573614485",
                    "name": "CAPACITAR A OTROS PARA LA ACCIÓN",
                    "color": "#7b1fa2",
                    "order_index": 3
                },
                {
                    "id": "cat_1760573662454",
                    "name": "ESTIMULAR EMOTIVAMENTE",
                    "color": "#d32f2f",
                    "order_index": 4
                }
            ],
            questions: leadershipQuestions.map((question, index) => ({
                id: `question_${index + 1}`,
                text_leader: question.leader,
                text_collaborator: question.collaborator,
                question_type: 'likert' as const,
                category_id: question.cat,
                order_index: index,
                is_active: true,
                response_config: {
                    scale: 5,
                    min_label: "Rara vez o Nunca",
                    max_label: "Muy frecuentemente",
                    labels: [
                        "Rara vez o Nunca",
                        "De vez en cuando",
                        "Algunas veces",
                        "Con frecuencia",
                        "Muy frecuentemente"
                    ]
                }
            }))
        };

        return await this.createQuestionnaire(formData);
    },

    // Crear cuestionario de liderazgo solo si no existe
    async createLeadershipInventoryQuestionnaireOnce(organizationId: string): Promise<string> {
        try {
            // Verificar si ya existe un cuestionario de liderazgo
            const { data: existingTemplates, error: searchError } = await supabase
                .from('question_templates')
                .select('id, title')
                .eq('organization_id', organizationId)
                .ilike('title', '%INVENTARIO DE PRÁCTICAS DE LIDERAZGO%')
                .eq('is_active', true);

            if (searchError) {
                console.error('Error searching for existing questionnaire:', searchError);
                throw searchError;
            }

            // Si ya existe, retornar el ID existente
            if (existingTemplates && existingTemplates.length > 0) {
                const existingTemplate = existingTemplates[0];
                console.log('✅ Cuestionario de liderazgo ya existe:', {
                    id: existingTemplate.id,
                    titulo: existingTemplate.title
                });
                return existingTemplate.id;
            }

            // Si no existe, crear uno nuevo
            console.log('📋 Creando nuevo cuestionario de liderazgo...');
            const newQuestionnaireId = await this.createLeadershipInventoryQuestionnaire(organizationId);

            console.log('✅ Nuevo cuestionario de liderazgo creado:', newQuestionnaireId);
            return newQuestionnaireId;

        } catch (error) {
            console.error('❌ Error en createLeadershipInventoryQuestionnaireOnce:', error);
            throw error;
        }
    }
};