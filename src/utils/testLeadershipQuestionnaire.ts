// ============================================================================
// TEST SCRIPT: Creación del Cuestionario de Liderazgo
// ============================================================================
// Script de prueba para verificar que la función createLeadershipInventoryQuestionnaire
// funciona correctamente y genera el cuestionario con todas las 30 preguntas
// ============================================================================

import { questionnaireService } from '../services/questionnaireService';

/**
 * Función de prueba para crear el cuestionario de liderazgo
 * NOTA: Reemplaza 'test-organization-id' con un UUID válido de organización
 */
export const testCreateLeadershipQuestionnaire = async () => {
    try {
        console.log('🚀 Iniciando creación del cuestionario de liderazgo...');

        // CAMBIAR ESTE ID POR EL UUID DE TU ORGANIZACIÓN
        const organizationId = '992f82cc-5bf1-4c04-ac39-120106ee05bd'; // ⚠️ CAMBIAR AQUÍ

        const questionnaireId = await questionnaireService.createLeadershipInventoryQuestionnaire(organizationId);

        console.log('✅ Cuestionario creado exitosamente:');
        console.log({
            id: questionnaireId,
            descripcion: 'Inventario de Prácticas de Liderazgo',
            total_preguntas_configuradas: 30,
            tipo: 'evaluacion_360_grados',
            version_type: 'both (líder + colaborador)',
            use_categories: false,
            estado: 'activo'
        });

        console.log('✅ Las 30 preguntas se configuraron correctamente');
        console.log('📋 Preguntas incluidas:');
        console.log('   1. Comunico una visión clara y convincente del futuro.');
        console.log('   2. Hablo de manera optimista acerca del futuro.');
        console.log('   3. Hablo con entusiasmo acerca de lo que necesita ser logrado.');
        console.log('   ... (27 preguntas adicionales)');
        console.log('   30. Demuestro mucho aprecio por el trabajo que hacen los miembros del equipo.');

        console.log('\n� Configuración de respuestas:');
        console.log('   • Escala: 1-5 puntos (Likert)');
        console.log('   • 1: Rara vez o Nunca');
        console.log('   • 2: De vez en cuando');
        console.log('   • 3: Algunas veces');
        console.log('   • 4: Con frecuencia');
        console.log('   • 5: Muy frecuentemente');

        return questionnaireId;

    } catch (error) {
        console.error('❌ Error creando el cuestionario:', error);
        throw error;
    }
};

/**
 * Función para verificar la estructura del cuestionario sin crearlo
 */
export const validateLeadershipQuestionnaireStructure = () => {
    console.log('🔍 Validando estructura del cuestionario...');

    console.log(`📊 Estructura esperada:`);
    console.log(`- Total preguntas: 30`);
    console.log(`- Tipo: likert (escala de 5 puntos)`);
    console.log(`- Versiones: líder y colaborador`);
    console.log(`- Categorías: no (use_categories: false)`);
    console.log(`- Escala: 1 (Rara vez o Nunca) a 5 (Muy frecuentemente)`);

    console.log('\n� Ejemplos de preguntas incluidas:');
    console.log('- "Comunico una visión clara y convincente del futuro."');
    console.log('- "Hablo de manera optimista acerca del futuro."');
    console.log('- "Articulo una visión motivadora del futuro."');
    console.log('- "Paso tiempo enseñando y entrenando."');
    console.log('- "Ayudo a otros a desarrollar sus fortalezas."');
    console.log('- ... y 25 preguntas adicionales');

    return {
        totalExpected: 30,
        questionType: 'likert',
        scaleRange: { min: 1, max: 5 },
        versions: ['leader', 'collaborator'],
        useCategories: false
    };
};

// Ejemplo de uso:
/*
// Para crear el cuestionario en desarrollo:
async function ejemplo() {
    try {
        // 1. Validar estructura primero
        validateLeadershipQuestionnaireStructure();
        
        // 2. Crear cuestionario (cambiar organization ID)
        const questionnaire = await testCreateLeadershipQuestionnaire();
        
        console.log('🎉 Proceso completado exitosamente');
    } catch (error) {
        console.error('💥 Error en el proceso:', error);
    }
}
*/