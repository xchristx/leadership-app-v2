// ============================================================================
// EXCEL EXPORT WITH EXCELJS - CORRECTED VERSION
// ============================================================================

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ComparativeData, CategoryData, CategorySummary } from './types';

export async function exportToExcelEnhanced(
    comparativeData: ComparativeData[],
    categoryData: CategoryData[],
    categorySummary: CategorySummary[]
) {

    try {
        console.log('Generando Excel con formato mejorado...');
        console.log({ categoryData })
        // Crear workbook de ExcelJS
        const workbook = new ExcelJS.Workbook();

        // Configurar propiedades del documento
        workbook.creator = 'Sistema de Evaluación de Liderazgo';
        workbook.created = new Date();
        workbook.modified = new Date();

        // ============================================================================
        // 1. HOJA RESUMEN CON FORMATO MEJORADO
        // ============================================================================
        const summarySheet = workbook.addWorksheet('Resumen Comparativo');

        // Configurar datos del resumen
        const summaryHeaders = ['Categoría', 'Promedio AUTO', 'Promedio OTROS', 'Diferencia', 'Estado'];
        summarySheet.addRow(summaryHeaders);

        // Agregar datos y calcular métricas
        categorySummary.forEach(cat => {
            const catData = categoryData.find(c => c.category.name === cat.category);
            const numQuestions = catData?.questions.length || 1;
            const autoAvg = Number((cat.auto_total / numQuestions).toFixed(2));
            const otrosAvg = Number((cat.otros_total / numQuestions).toFixed(2));
            const difference = Number(Math.abs(autoAvg - otrosAvg).toFixed(2));
            const estado = difference > 1.5 ? 'Desalineado' : difference > 0.8 ? 'Moderado' : 'Alineado';

            summarySheet.addRow([cat.category, autoAvg, otrosAvg, difference, estado]);
        });

        // Formatear encabezados
        const headerRow = summarySheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4472C4' }
        };

        // Aplicar formato condicional a la columna de diferencia
        for (let i = 2; i <= categorySummary.length + 1; i++) {
            const diffCell = summarySheet.getCell(`D${i}`);
            const diffValue = diffCell.value as number;
            const estadoCell = summarySheet.getCell(`E${i}`);

            if (diffValue > 1.5) {
                diffCell.font = { color: { argb: 'FF0000' }, bold: true };
                estadoCell.font = { color: { argb: 'FF0000' }, bold: true };
            } else if (diffValue > 0.8) {
                diffCell.font = { color: { argb: 'FFA500' }, bold: true };
                estadoCell.font = { color: { argb: 'FFA500' }, bold: true };
            } else {
                diffCell.font = { color: { argb: '00B050' }, bold: true };
                estadoCell.font = { color: { argb: '00B050' }, bold: true };
            }
        }

        // Configurar anchos de columna
        summarySheet.columns = [
            { width: 30 }, // Categoría
            { width: 15 }, // AUTO
            { width: 15 }, // OTROS
            { width: 12 }, // Diferencia
            { width: 15 }  // Estado
        ];

        // Agregar tabla con estilo - VERSIÓN CORREGIDA
        const summaryTableData = categorySummary.map(cat => {
            const catData = categoryData.find(c => c.category.name === cat.category);
            const numQuestions = catData?.questions.length || 1;
            const autoAvg = Number((cat.auto_total / numQuestions).toFixed(2));
            const otrosAvg = Number((cat.otros_total / numQuestions).toFixed(2));
            const difference = Number(Math.abs(autoAvg - otrosAvg).toFixed(2));
            const estado = difference > 1.5 ? 'Desalineado' : difference > 0.8 ? 'Moderado' : 'Alineado';

            return [cat.category, autoAvg, otrosAvg, difference, estado];
        });

        summarySheet.addTable({
            name: 'ResumenComparativo',
            ref: 'A1',
            headerRow: true,
            totalsRow: false,
            style: {
                theme: 'TableStyleMedium2',
                showRowStripes: true,
            },
            columns: [
                { name: 'Categoría', filterButton: true },
                { name: 'Promedio AUTO', filterButton: true },
                { name: 'Promedio OTROS', filterButton: true },
                { name: 'Diferencia', filterButton: true },
                { name: 'Estado', filterButton: true },
            ],
            rows: summaryTableData
        });

        // ============================================================================
        // 2. HOJAS POR CATEGORÍA CON FORMATO MEJORADO
        // ============================================================================
        categoryData.forEach((category) => {
            const sheetName = category.category.name.length > 31
                ? category.category.name.substring(0, 28) + '...'
                : category.category.name;

            const categorySheet = workbook.addWorksheet(sheetName);

            // Calcular máximo de observadores
            const maxObservers = Math.max(...category.questions.map(q => q.collaborator_responses.length));

            // Encabezados
            const headers = [
                'No.', 'Pregunta', 'AUTO', 'OBSERVADORES',
                ...Array.from({ length: maxObservers }, (_, i) => `Obs ${i + 1}`),
                'Diferencia', 'Estado'
            ];

            categorySheet.addRow(headers);

            // Agregar datos de preguntas
            category.questions.forEach((question) => {
                const difference = Math.abs(question.leader_avg - question.collaborator_avg);
                const estado = difference > 1.5 ? 'Crítico' : difference > 0.8 ? 'Atención' : 'OK';

                const row = [
                    question.question_number,
                    question.question_text,
                    Number(question.leader_avg.toFixed(2)),
                    Number(question.collaborator_avg.toFixed(2)),
                    ...Array.from({ length: maxObservers }, (_, i) =>
                        question.collaborator_responses[i]
                            ? Number(question.collaborator_responses[i].toFixed(2))
                            : ''
                    ),
                    Number(difference.toFixed(2)),
                    estado
                ];

                categorySheet.addRow(row);
            });

            // Formatear encabezados
            const catHeaderRow = categorySheet.getRow(1);
            catHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
            catHeaderRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '70AD47' }
            };

            // Aplicar formato condicional
            for (let i = 2; i <= category.questions.length + 1; i++) {
                const diffCell = categorySheet.getCell(`F${i}`);
                const diffValue = diffCell.value as number;
                const estadoCell = categorySheet.getCell(`G${i}`);

                if (diffValue > 1.5) {
                    diffCell.font = { color: { argb: 'FF0000' }, bold: true };
                    estadoCell.font = { color: { argb: 'FF0000' }, bold: true };
                    estadoCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFC7CE' }
                    };
                } else if (diffValue > 0.8) {
                    diffCell.font = { color: { argb: 'FFA500' }, bold: true };
                    estadoCell.font = { color: { argb: 'FFA500' }, bold: true };
                    estadoCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFEB9C' }
                    };
                } else {
                    diffCell.font = { color: { argb: '00B050' }, bold: true };
                    estadoCell.font = { color: { argb: '00B050' }, bold: true };
                    estadoCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'C6EFCE' }
                    };
                }
            }

            // Configurar anchos de columna
            categorySheet.columns = [
                { width: 8 },   // No.
                { width: 50 },  // Pregunta
                { width: 12 },  // AUTO
                { width: 15 },  // OBSERVADORES
                ...Array.from({ length: maxObservers }, () => ({ width: 10 })), // Observadores
                { width: 12 },  // Diferencia
                { width: 12 }   // Estado
            ];

            // Agregar tabla con filtros - VERSIÓN CORREGIDA
            const categoryTableData = category.questions.map(question => {
                const difference = Math.abs(question.leader_avg - question.collaborator_avg);
                const estado = difference > 1.5 ? 'Crítico' : difference > 0.8 ? 'Atención' : 'OK';

                const row = [
                    question.question_number,
                    question.question_text,
                    Number(question.leader_avg.toFixed(2)),
                    Number(question.collaborator_avg.toFixed(2)),
                    ...Array.from({ length: maxObservers }, (_, i) =>
                        question.collaborator_responses[i]
                            ? Number(question.collaborator_responses[i].toFixed(2))
                            : ''
                    ),
                    Number(difference.toFixed(2)),
                    estado
                ];

                return row;
            });

            categorySheet.addTable({
                name: `Tabla${sheetName.replace(/[^a-zA-Z0-9]/g, '')}`,
                ref: 'A1',
                headerRow: true,
                totalsRow: false,
                style: {
                    theme: 'TableStyleMedium3',
                    showRowStripes: true,
                },
                columns: headers.map(header => ({ name: header, filterButton: true })),
                rows: categoryTableData
            });

            // ============================================================================
            // AGREGAR DATOS PREPARADOS PARA GRÁFICOS MANUALES
            // ============================================================================
            // const chartDataStartRow = category.questions.length + 4;

            // // Título para datos de gráfico
            // categorySheet.mergeCells(`A${chartDataStartRow}:C${chartDataStartRow}`);
            // const chartTitleCell = categorySheet.getCell(`A${chartDataStartRow}`);
            // chartTitleCell.value = 'DATOS PARA GRÁFICOS - ' + category.category.name.toUpperCase();
            // chartTitleCell.font = { bold: true, size: 12, color: { argb: '4472C4' } };
            // chartTitleCell.fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: 'D9E1F2' }
            // };

            // // Encabezados para datos de gráfico
            // categorySheet.addRow(['Pregunta', 'AUTO', 'OBSERVADORES', 'Diferencia']);

            // // Datos para gráficos
            // category.questions.forEach((question) => {
            //     const difference = Math.abs(question.leader_avg - question.collaborator_avg);
            //     categorySheet.addRow([
            //         `P${question.question_number}`,
            //         Number(question.leader_avg.toFixed(2)),
            //         Number(question.collaborator_avg.toFixed(2)),
            //         Number(difference.toFixed(2))
            //     ]);
            // });

            // // Formatear datos de gráfico
            // const chartHeaderRow = categorySheet.getRow(chartDataStartRow + 1);
            // chartHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
            // chartHeaderRow.fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: '7030A0' }
            // };
        });

        // ============================================================================
        // 3. HOJA DE ANÁLISIS COMPLETO
        // ============================================================================
        const analysisSheet = workbook.addWorksheet('Análisis Completo');

        const analysisHeaders = [
            'No.', 'Pregunta', 'AUTO', 'OBSERVADORES', 'Diferencia',
            'Estado', 'Categoría', 'Total Respuestas'
        ];

        analysisSheet.addRow(analysisHeaders);

        // Agregar datos completos
        comparativeData.forEach(item => {
            const difference = item.leader_avg - item.collaborators_avg;
            const estado = Math.abs(difference) > 1.5 ? 'Crítico' : Math.abs(difference) > 0.8 ? 'Atención' : 'OK';
            const categoria = categoryData.find(cat =>
                cat.questions.some(q => q.question_id === item.question_id)
            )?.category.name || 'Sin categoría';

            analysisSheet.addRow([
                item.order_index || 0,
                item.question_text,
                Number(item.leader_avg.toFixed(2)),
                Number(item.collaborators_avg.toFixed(2)),
                Number(difference.toFixed(2)),
                estado,
                categoria,
                item.leader_count + item.collaborators_count
            ]);
        });

        // Formatear encabezados de análisis
        const analysisHeaderRow = analysisSheet.getRow(1);
        analysisHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
        analysisHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF6B6B' }
        };

        // Aplicar formato condicional
        for (let i = 2; i <= comparativeData.length + 1; i++) {
            const diffCell = analysisSheet.getCell(`E${i}`);
            const diffValue = Math.abs(diffCell.value as number);
            const estadoCell = analysisSheet.getCell(`F${i}`);

            if (diffValue > 1.5) {
                diffCell.font = { color: { argb: 'FF0000' }, bold: true };
                estadoCell.font = { color: { argb: 'FF0000' }, bold: true };
                estadoCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFC7CE' }
                };
            } else if (diffValue > 0.8) {
                diffCell.font = { color: { argb: 'FFA500' }, bold: true };
                estadoCell.font = { color: { argb: 'FFA500' }, bold: true };
                estadoCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFEB9C' }
                };
            } else {
                diffCell.font = { color: { argb: '00B050' }, bold: true };
                estadoCell.font = { color: { argb: '00B050' }, bold: true };
                estadoCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'C6EFCE' }
                };
            }
        }

        // Configurar anchos de columna
        analysisSheet.columns = [
            { width: 8 },  // No.
            { width: 50 }, // Pregunta
            { width: 12 }, // AUTO
            { width: 15 }, // OBSERVADORES
            { width: 12 }, // Diferencia
            { width: 12 }, // Estado
            { width: 25 }, // Categoría
            { width: 15 }  // Total Respuestas
        ];

        // Agregar tabla con filtros - VERSIÓN CORREGIDA
        const analysisTableData = comparativeData.map(item => {
            const difference = item.leader_avg - item.collaborators_avg;
            const estado = Math.abs(difference) > 1.5 ? 'Crítico' : Math.abs(difference) > 0.8 ? 'Atención' : 'OK';
            const categoria = categoryData.find(cat =>
                cat.questions.some(q => q.question_id === item.question_id)
            )?.category.name || 'Sin categoría';

            return [
                item.order_index || 0,
                item.question_text,
                Number(item.leader_avg.toFixed(2)),
                Number(item.collaborators_avg.toFixed(2)),
                Number(difference.toFixed(2)),
                estado,
                categoria,
                item.leader_count + item.collaborators_count
            ];
        });

        analysisSheet.addTable({
            name: 'AnalisisCompleto',
            ref: 'A1',
            headerRow: true,
            totalsRow: false,
            style: {
                theme: 'TableStyleMedium4',
                showRowStripes: true,
            },
            columns: analysisHeaders.map(header => ({ name: header, filterButton: true })),
            rows: analysisTableData
        });

        // ============================================================================
        // 4. HOJA DE INSTRUCCIONES PARA GRÁFICOS
        // ============================================================================
        // const instructionsSheet = workbook.addWorksheet('Instrucciones Gráficos');

        // instructionsSheet.mergeCells('A1:D1');
        // const titleCell = instructionsSheet.getCell('A1');
        // titleCell.value = 'INSTRUCCIONES PARA CREAR GRÁFICOS EN EXCEL';
        // titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
        // titleCell.fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: '4472C4' }
        // };
        // titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // const instructions = [
        //     '',
        //     '📊 CÓMO CREAR GRÁFICOS AUTOMÁTICAMENTE:',
        //     '',
        //     '1. 📈 GRÁFICO DE COMPARACIÓN POR CATEGORÍA:',
        //     '   • Ve a la hoja "Resumen Comparativo"',
        //     '   • Selecciona las columnas A, B y C (Categoría, AUTO, OTROS)',
        //     '   • Insertar > Gráficos > Columna Agrupada',
        //     '',
        //     '2. 🔍 GRÁFICOS POR CATEGORÍA INDIVIDUAL:',
        //     '   • En cada hoja de categoría, busca "DATOS PARA GRÁFICOS"',
        //     '   • Selecciona los datos de las columnas (Pregunta, AUTO, OBSERVADORES)',
        //     '   • Insertar > Gráficos > Líneas o Barras',
        //     '',
        //     '3. 📋 GRÁFICO DE ANÁLISIS COMPLETO:',
        //     '   • Ve a la hoja "Análisis Completo"',
        //     '   • Usa los filtros para seleccionar categorías específicas',
        //     '   • Insertar > Gráficos > Dispersión o Radar',
        //     '',
        //     '🎨 RECOMENDACIONES DE GRÁFICOS:',
        //     '   • Comparación AUTO vs OTROS: Gráfico de columnas agrupadas',
        //     '   • Tendencias por pregunta: Gráfico de líneas',
        //     '   • Diferencias: Gráfico de barras horizontales',
        //     '   • Estado general: Gráfico de radar o dona',
        //     '',
        //     '💡 CONSEJOS:',
        //     '   • Los datos ya están preparados y formateados',
        //     '   • Usa los filtros de tabla para analizar subconjuntos',
        //     '   • Los colores indican: Verde=Alineado, Amarillo=Atención, Rojo=Crítico'
        // ];

        // instructions.forEach((instruction, index) => {
        //     const row = instructionsSheet.getRow(index + 3);
        //     row.getCell(1).value = instruction;

        //     if (instruction.includes('📊') || instruction.includes('🎨') || instruction.includes('💡')) {
        //         row.font = { bold: true, color: { argb: '4472C4' } };
        //     } else if (instruction.includes('1.') || instruction.includes('2.') || instruction.includes('3.')) {
        //         row.font = { bold: true };
        //     }
        // });

        // instructionsSheet.columns = [
        //     { width: 80 }
        // ];

        // ============================================================================
        // GENERAR Y DESCARGAR ARCHIVO
        // ============================================================================
        const buffer = await workbook.xlsx.writeBuffer();

        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Nombre del archivo con timestamp
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const fileName = `analisis_liderazgo_formateado_${timestamp}.xlsx`;

        saveAs(blob, fileName);

        console.log('✅ Excel con formato mejorado generado exitosamente');
        return true;

    } catch (error) {
        console.error('❌ Error generando Excel con formato:', error);
        return false;
    }
}

// ============================================================================
// VERSIÓN SIMPLIFICADA SIN TABLAS (POR SI PERSISTEN LOS ERRORES)
// ============================================================================

export async function exportToExcelSimple(
    _comparativeData: ComparativeData[],
    categoryData: CategoryData[],
    categorySummary: CategorySummary[]
) {
    try {
        console.log('Generando Excel simplificado...');

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema de Evaluación de Liderazgo';
        workbook.created = new Date();

        // 1. Hoja Resumen
        const summarySheet = workbook.addWorksheet('Resumen');

        // Encabezados
        summarySheet.addRow(['Categoría', 'Promedio AUTO', 'Promedio OTROS', 'Diferencia', 'Estado']);

        // Datos
        categorySummary.forEach(cat => {
            const catData = categoryData.find(c => c.category.name === cat.category);
            const numQuestions = catData?.questions.length || 1;
            const autoAvg = Number((cat.auto_total / numQuestions).toFixed(2));
            const otrosAvg = Number((cat.otros_total / numQuestions).toFixed(2));
            const difference = Number(Math.abs(autoAvg - otrosAvg).toFixed(2));
            const estado = difference > 1.5 ? 'Desalineado' : difference > 0.8 ? 'Moderado' : 'Alineado';

            summarySheet.addRow([cat.category, autoAvg, otrosAvg, difference, estado]);
        });

        // Formato básico
        summarySheet.getRow(1).font = { bold: true };
        summarySheet.columns = [
            { width: 30 }, { width: 15 }, { width: 15 }, { width: 12 }, { width: 15 }
        ];

        // 2. Hojas por categoría
        categoryData.forEach(category => {
            const sheetName = category.category.name.length > 31
                ? category.category.name.substring(0, 28) + '...'
                : category.category.name;

            const categorySheet = workbook.addWorksheet(sheetName);

            // Encabezados básicos
            categorySheet.addRow(['No.', 'Pregunta', 'AUTO', 'OBSERVADORES', 'Diferencia']);
            categorySheet.getRow(1).font = { bold: true };

            // Datos
            category.questions.forEach(question => {
                const difference = Math.abs(question.leader_avg - question.collaborator_avg);
                categorySheet.addRow([
                    question.question_number,
                    question.question_text,
                    Number(question.leader_avg.toFixed(2)),
                    Number(question.collaborator_avg.toFixed(2)),
                    Number(difference.toFixed(2))
                ]);
            });

            categorySheet.columns = [
                { width: 8 }, { width: 50 }, { width: 12 }, { width: 15 }, { width: 12 }
            ];
        });

        // Generar archivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const fileName = `analisis_liderazgo_${new Date().toISOString().slice(0, 10)}.xlsx`;
        saveAs(blob, fileName);

        console.log('✅ Excel simplificado generado exitosamente');
        return true;

    } catch (error) {
        console.error('❌ Error generando Excel simplificado:', error);
        return false;
    }
}