// ============================================================================
// COMPONENTE CATEGORY REPORT TAB
// ============================================================================
// Pestaña de análisis por categorías en modo reporte estructurado para exportación
// ============================================================================

import {
  Box,
  Typography,
  Alert,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CardMedia,
  useTheme,
} from '@mui/material';
import { PictureAsPdf as PdfIcon, Description as WordIcon, Print as PrintIcon } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
  Document,
  Packer,
  Paragraph,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  TextRun,
  ImageRun,
} from 'docx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { pdf } from '@react-pdf/renderer';
import { ReportPDFDocument } from './PDF/ReportPDFDocument';
import SimplePDFExporter from '../../PDF/SimplePDFExporter';
import PuppeteerPDFExport from '../../PDF/PuppeteerPDFExport';
import { useRef, useState } from 'react';
import type { CategoryData, CategorySummary, ComparativeData } from './types';

interface CategoryReportTabProps {
  categoryData: CategoryData[];
  categorySummary: CategorySummary[];
  comparativeData: ComparativeData[];
  loading: boolean;
  teamName?: string;
  teamLeader?: string;
}

export function CategoryReportTab({
  categoryData,
  categorySummary,
  comparativeData,
  loading,
  teamName = 'Equipo',
  teamLeader,
}: CategoryReportTabProps) {
  // Referencias para capturar gráficos
  const lineChartRef = useRef<HTMLDivElement>(null);
  const barChartRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Estado para el loading del PDF
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentPdfPage, setCurrentPdfPage] = useState(0);
  const [totalPdfPages, setTotalPdfPages] = useState(0);
  // Estado para el loading del Word
  const [wordLoading, setWordLoading] = useState(false);

  const LEADERSHIP_PRACTICES = categoryData.map(cat => cat.category);

  const { palette } = useTheme();

  const hasSupervisorData = categorySummary?.some(cat => cat.supervisor_total > 0);
  // Función para capturar un gráfico como imagen
  const captureChart = async (chartRef: HTMLDivElement): Promise<Uint8Array | null> => {
    try {
      const canvas = await html2canvas(chartRef, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      return new Promise(resolve => {
        canvas.toBlob(blob => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              const arrayBuffer = reader.result as ArrayBuffer;
              resolve(new Uint8Array(arrayBuffer));
            };
            reader.readAsArrayBuffer(blob);
          } else {
            resolve(null);
          }
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error capturando gráfico:', error);
      return null;
    }
  };

  // Estilo común para páginas en formato carta (216mm x 279mm)
  const pageStyle = {
    width: '216mm',
    minHeight: '279mm',
    maxHeight: '279mm',
    p: { xs: '15mm', md: '20mm' },
    mb: '10mm',
    boxSizing: 'border-box',
    overflow: 'hidden',
    backgroundColor: 'white',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    '@media print': {
      width: '216mm',
      minHeight: '279mm',
      maxHeight: '279mm',
      p: '20mm',
      mb: 0,
      boxShadow: 'none',
      pageBreakAfter: 'always',
      overflow: 'visible',
    },
  };
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography>Cargando datos del reporte...</Typography>
      </Box>
    );
  }

  if (categoryData.length === 0) {
    return <Alert severity="info">No hay datos disponibles para generar el reporte por categorías.</Alert>;
  }

  // Funciones de exportación
  const handleExportToPDF = async () => {
    try {
      setPdfLoading(true);
      setCurrentPdfPage(1);
      setTotalPdfPages(3 + categoryData.length * 2); // Carátula + Resumen + Gráfico + (2 páginas por categoría)

      console.log('Iniciando exportación a PDF con React-PDF...');

      // Capturar gráficos como imágenes
      let lineChartImage: string | null = null;
      const barChartImages: (string | null)[] = [];

      // Capturar gráfico de líneas principal
      if (lineChartRef.current) {
        setCurrentPdfPage(2);
        const canvas = await html2canvas(lineChartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });
        lineChartImage = canvas.toDataURL('image/png');
      }

      // Capturar gráficos de barras por categoría
      for (let i = 0; i < barChartRefs.current.length; i++) {
        setCurrentPdfPage(3 + i);
        const chartRef = barChartRefs.current[i];
        if (chartRef) {
          const canvas = await html2canvas(chartRef, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
          });
          barChartImages.push(canvas.toDataURL('image/png'));
        } else {
          barChartImages.push(null);
        }
      }

      setCurrentPdfPage(totalPdfPages);

      // Generar PDF con @react-pdf/renderer
      const blob = await pdf(
        <ReportPDFDocument
          teamName={teamName}
          categoryData={categoryData}
          categorySummary={categorySummary}
          leadershipPractices={categoryData.map(cat => cat.category)}
          chartImages={{
            lineChart: lineChartImage,
            barCharts: barChartImages,
          }}
          comparativeDataLength={comparativeData.length}
        />
      ).toBlob();

      // Generar nombre del archivo
      const fileName = `Reporte_Liderazgo_${teamName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Guardar el PDF
      saveAs(blob, fileName);

      console.log(`PDF generado exitosamente: ${fileName}`);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setPdfLoading(false);
      setCurrentPdfPage(0);
      setTotalPdfPages(0);
    }
  };

  const handleExportToWord = async () => {
    try {
      setWordLoading(true);
      // opcional: usar contadores de página si se quiere mostrar progreso más avanzado
      // Capturar gráficos como imágenes
      let lineChartImage: Uint8Array | null = null;
      const barChartImages: (Uint8Array | null)[] = [];

      // Capturar gráfico de líneas principal
      if (lineChartRef.current) {
        lineChartImage = await captureChart(lineChartRef.current);
      }

      // Capturar gráficos de barras por categoría
      for (let i = 0; i < barChartRefs.current.length; i++) {
        const chartRef = barChartRefs.current[i];
        if (chartRef) {
          const image = await captureChart(chartRef);
          barChartImages.push(image);
        } else {
          barChartImages.push(null);
        }
      }

      // Calcular prácticas de liderazgo
      const leadershipPractices = categorySummary.filter(cat =>
        LEADERSHIP_PRACTICES.some(
          practice =>
            practice.name.toLowerCase().includes(cat.category.toLowerCase()) ||
            cat.category.toLowerCase().includes(practice.name.toLowerCase())
        )
      );

      // Preparar colores para el documento Word (hex sin '#')
      const supervisorHex = (palette.supervisor?.main ?? '#ff6b35').replace('#', '');

      // Crear el documento
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440, // 1 inch = 1440 twips
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            children: [
              // CARÁTULA
              new Paragraph({
                text: 'INVENTARIO DE PRÁCTICAS DE LIDERAZGO',
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
              }),
              new Paragraph({
                text: teamName,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              new Paragraph({
                text: 'Análisis Comparativo de las Cinco Prácticas de Liderazgo',
                alignment: AlignmentType.CENTER,
                spacing: { after: 800 },
              }),
              new Paragraph({
                text: new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),

              // Salto de página manual
              new Paragraph({
                children: [],
                pageBreakBefore: true,
              }),

              // RESUMEN EJECUTIVO
              new Paragraph({
                text: 'Resumen Ejecutivo',
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              new Paragraph({
                text: 'Cinco Prácticas de Liderazgo - Análisis Comparativo',
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),

              // Información del equipo
              new Paragraph({
                children: [new TextRun({ text: 'Equipo: ', bold: true }), new TextRun({ text: teamName })],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Período: ', bold: true }),
                  new TextRun({ text: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }),
                ],
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Total de Preguntas: ', bold: true }),
                  new TextRun({ text: comparativeData.length.toString() }),
                ],
                spacing: { after: 200 },
              }),
              // new Paragraph({
              //   children: [
              //     new TextRun({ text: 'Categorías Analizadas: ', bold: true }),
              //     new TextRun({ text: categoryData.length.toString() }),
              //   ],
              //   spacing: { after: 400 },
              // }),

              // Tabla comparativa principal
              new Paragraph({
                text: 'Cuadro Comparativo - Autopercepción vs Percepción de Colaboradores',
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 300 },
              }),

              // Crear tabla de resumen
              new DocxTable({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                rows: [
                  // Encabezado
                  new DocxTableRow({
                    children: [
                      new DocxTableCell({
                        children: [new Paragraph({ text: 'PRÁCTICA DE LIDERAZGO', alignment: AlignmentType.CENTER })],
                        shading: { fill: '1976d2' },
                        width: { size: 36, type: WidthType.PERCENTAGE },
                      }),
                      new DocxTableCell({
                        children: [new Paragraph({ text: 'AUTOPERCEPCIÓN', alignment: AlignmentType.CENTER })],
                        shading: { fill: '1976d2' },
                        width: { size: 16, type: WidthType.PERCENTAGE },
                      }),
                      new DocxTableCell({
                        children: [new Paragraph({ text: 'OBSERVADORES', alignment: AlignmentType.CENTER })],
                        shading: { fill: '1976d2' },
                        width: { size: 16, type: WidthType.PERCENTAGE },
                      }),
                      ...(hasSupervisorData
                        ? [
                            new DocxTableCell({
                              children: [new Paragraph({ text: 'SUPERVISORES', alignment: AlignmentType.CENTER })],
                              shading: { fill: supervisorHex },
                              width: { size: 16, type: WidthType.PERCENTAGE },
                            }),
                          ]
                        : []),
                      new DocxTableCell({
                        children: [new Paragraph({ text: 'DIFERENCIA', alignment: AlignmentType.CENTER })],
                        shading: { fill: '1976d2' },
                        width: { size: hasSupervisorData ? 16 : 28, type: WidthType.PERCENTAGE },
                      }),
                    ],
                  }),
                  // Filas de datos
                  ...leadershipPractices.map(practice => {
                    const difference = practice.auto_total - practice.otros_total;
                    return new DocxTableRow({
                      children: [
                        new DocxTableCell({
                          children: [new Paragraph({ text: practice.category })],
                        }),
                        new DocxTableCell({
                          children: [new Paragraph({ text: practice.auto_total.toFixed(1), alignment: AlignmentType.CENTER })],
                        }),
                        new DocxTableCell({
                          children: [new Paragraph({ text: practice.otros_total.toFixed(1), alignment: AlignmentType.CENTER })],
                        }),
                        ...(hasSupervisorData
                          ? [
                              new DocxTableCell({
                                children: [
                                  new Paragraph({
                                    text: ((practice as { supervisor_total?: number }).supervisor_total ?? 0).toFixed(1),
                                    alignment: AlignmentType.CENTER,
                                  }),
                                ],
                                shading: { fill: supervisorHex },
                              }),
                            ]
                          : []),
                        new DocxTableCell({
                          children: [
                            new Paragraph({
                              text: `${difference > 0 ? '+' : ''}${difference.toFixed(1)}`,
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                        }),
                      ],
                    });
                  }),
                ],
              }),

              // Agregar interpretación después de la tabla
              new Paragraph({
                text: 'Interpretación',
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 400, after: 200 },
              }),
              new Paragraph({
                text: 'Este cuadro presenta la comparación entre la autopercepción del líder y la percepción de sus colaboradores en las cinco prácticas fundamentales del liderazgo. Las diferencias positivas indican que el líder se percibe con mayor competencia, mientras que las diferencias negativas sugieren áreas donde los colaboradores ven un desempeño superior al que el líder reconoce en sí mismo.',
                spacing: { after: 400 },
              }),

              // Salto de página para análisis gráfico
              new Paragraph({
                children: [],
                pageBreakBefore: true,
              }),

              // ANÁLISIS GRÁFICO COMPARATIVO
              new Paragraph({
                text: 'Análisis Gráfico Comparativo',
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),

              // Insertar gráfico principal en la página de análisis gráfico
              ...(lineChartImage
                ? [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: lineChartImage,
                          transformation: {
                            width: 500,
                            height: 300,
                          },
                          type: 'png',
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 400 },
                    }),
                  ]
                : []),

              // Interpretación del análisis gráfico
              new Paragraph({
                text: 'Interpretación del Análisis',
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: hasSupervisorData
                  ? 'El gráfico de líneas facilita la visualización de las diferencias entre autopercepción, observadores y supervisores en cada práctica. Las líneas azules (autopercepción), rojas (observadores) y naranjas (supervisores) permiten identificar rápidamente:'
                  : 'El gráfico de líneas facilita la visualización de las diferencias entre autopercepción y percepción externa en cada práctica. Las líneas azules (autopercepción) y rojas (observadores) permiten identificar rápidamente:',
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: '• Convergencias: Donde ambas líneas se aproximan, indicando alineación perceptual',
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: '• Divergencias: Separaciones significativas que requieren atención y desarrollo',
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: '• Patrones: Tendencias consistentes que revelan fortalezas o áreas de mejora',
                spacing: { after: 400 },
              }),

              // Salto de página antes del detalle
              new Paragraph({
                children: [],
                pageBreakBefore: true,
              }),

              // DETALLE POR CATEGORÍA
              ...categoryData.flatMap((category, categoryIndex) => {
                const practiceInfo = LEADERSHIP_PRACTICES.find(
                  practice =>
                    practice.name.toLowerCase().includes(category.category.name.toLowerCase()) ||
                    category.category.name.toLowerCase().includes(practice.name.toLowerCase())
                );

                return [
                  // PÁGINA A: TÍTULO, DESCRIPCIÓN Y GRÁFICO
                  // Título de la categoría
                  new Paragraph({
                    text: category.category.name,
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                  }),

                  // Descripción de la práctica
                  ...(practiceInfo && practiceInfo.description
                    ? [
                        new Paragraph({
                          text: 'Descripción de la Práctica',
                          heading: HeadingLevel.HEADING_2,
                          spacing: { after: 200 },
                        }),
                        new Paragraph({
                          text: practiceInfo.description,
                          spacing: { after: 400 },
                        }),
                      ]
                    : []),

                  // Análisis comparativo por pregunta (con gráfico)
                  new Paragraph({
                    text: 'Análisis Comparativo por Pregunta',
                    heading: HeadingLevel.HEADING_2,
                    spacing: { after: 300 },
                  }),

                  // Insertar gráfico de barras si existe
                  ...(barChartImages[categoryIndex]
                    ? [
                        new Paragraph({
                          children: [
                            new ImageRun({
                              data: barChartImages[categoryIndex]!,
                              transformation: {
                                width: 450,
                                height: 280,
                              },
                              type: 'png',
                            }),
                          ],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 300 },
                        }),
                      ]
                    : []),

                  // Interpretación del gráfico
                  new Paragraph({
                    text: 'Interpretación del Análisis',
                    heading: HeadingLevel.HEADING_3,
                    spacing: { after: 200 },
                  }),
                  new Paragraph({
                    text: `Este gráfico muestra la comparación entre la autopercepción del líder y la percepción de los colaboradores para cada pregunta específica de la práctica ${category.category.name}. Las barras permiten identificar preguntas con mayor o menor alineación perceptual.`,
                    spacing: { after: 400 },
                  }),

                  // Salto de página para la tabla detallada
                  new Paragraph({
                    children: [],
                    pageBreakBefore: true,
                  }),

                  // PÁGINA B: TABLA DETALLADA
                  new Paragraph({
                    text: `Detalle por Pregunta - ${category.category.name}`,
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                  }),

                  new DocxTable({
                    width: {
                      size: 100,
                      type: WidthType.PERCENTAGE,
                    },
                    rows: [
                      // Encabezado
                      new DocxTableRow({
                        children: [
                          new DocxTableCell({
                            children: [new Paragraph({ text: 'No.', alignment: AlignmentType.CENTER })],
                            shading: { fill: '0369a1' },
                            width: { size: 8, type: WidthType.PERCENTAGE },
                          }),
                          new DocxTableCell({
                            children: [new Paragraph({ text: 'PREGUNTA', alignment: AlignmentType.CENTER })],
                            shading: { fill: '0369a1' },
                            width: { size: 48, type: WidthType.PERCENTAGE },
                          }),
                          new DocxTableCell({
                            children: [new Paragraph({ text: 'AUTOPERCEPCIÓN', alignment: AlignmentType.CENTER })],
                            shading: { fill: '0369a1' },
                            width: { size: 14, type: WidthType.PERCENTAGE },
                          }),
                          new DocxTableCell({
                            children: [new Paragraph({ text: 'OBSERVADORES', alignment: AlignmentType.CENTER })],
                            shading: { fill: '0369a1' },
                            width: { size: 14, type: WidthType.PERCENTAGE },
                          }),
                          ...(hasSupervisorData
                            ? [
                                new DocxTableCell({
                                  children: [new Paragraph({ text: 'SUPERVISORES', alignment: AlignmentType.CENTER })],
                                  shading: { fill: 'ff6b35' },
                                  width: { size: 12, type: WidthType.PERCENTAGE },
                                }),
                              ]
                            : []),
                          new DocxTableCell({
                            children: [new Paragraph({ text: 'DIFERENCIA', alignment: AlignmentType.CENTER })],
                            shading: { fill: '0369a1' },
                            width: { size: hasSupervisorData ? 8 : 10, type: WidthType.PERCENTAGE },
                          }),
                        ],
                      }),
                      // Filas de preguntas
                      ...category.questions.map(question => {
                        const difference = question.leader_avg - question.collaborator_avg;
                        return new DocxTableRow({
                          children: [
                            new DocxTableCell({
                              children: [new Paragraph({ text: question.question_number.toString(), alignment: AlignmentType.CENTER })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: question.question_text })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: question.leader_avg.toFixed(1), alignment: AlignmentType.CENTER })],
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: question.collaborator_avg.toFixed(1), alignment: AlignmentType.CENTER })],
                            }),
                            ...(hasSupervisorData
                              ? [
                                  new DocxTableCell({
                                    children: [
                                      new Paragraph({
                                        text: ((question as { supervisor_avg?: number }).supervisor_avg ?? 0).toFixed(1),
                                        alignment: AlignmentType.CENTER,
                                      }),
                                    ],
                                  }),
                                ]
                              : []),
                            new DocxTableCell({
                              children: [
                                new Paragraph({
                                  text: `${difference > 0 ? '+' : ''}${difference.toFixed(1)}`,
                                  alignment: AlignmentType.CENTER,
                                }),
                              ],
                            }),
                          ],
                        });
                      }),
                    ],
                  }),

                  // Resumen de la categoría
                  new Paragraph({
                    text: 'Resumen de la Práctica',
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 400, after: 200 },
                  }),

                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Promedio Autopercepción: ', bold: true }),
                      new TextRun({
                        text: (category.questions.reduce((sum, q) => sum + q.leader_avg, 0) / category.questions.length).toFixed(1),
                      }),
                    ],
                    spacing: { after: 200 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Promedio Observadores: ', bold: true }),
                      new TextRun({
                        text: (category.questions.reduce((sum, q) => sum + q.collaborator_avg, 0) / category.questions.length).toFixed(1),
                      }),
                    ],
                    spacing: { after: 200 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Diferencia Promedio: ', bold: true }),
                      new TextRun({
                        text: `${(
                          category.questions.reduce((sum, q) => sum + (q.leader_avg - q.collaborator_avg), 0) / category.questions.length
                        ).toFixed(1)}`,
                      }),
                    ],
                    spacing: { after: 400 },
                  }),

                  // Salto de página excepto en la última categoría
                  ...(categoryIndex < categoryData.length - 1
                    ? [
                        new Paragraph({
                          children: [],
                          pageBreakBefore: true,
                        }),
                      ]
                    : []),
                ];
              }),
            ],
          },
        ],
      });

      // Generar el buffer del documento
      const buffer = await Packer.toBlob(doc);

      // Crear el nombre del archivo
      const fileName = `Reporte_Liderazgo_${teamName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;

      // Guardar el archivo
      saveAs(buffer, fileName);

      console.log('Documento Word generado exitosamente');
    } catch (error) {
      console.error('Error al generar el documento Word:', error);
      // Aquí podrías mostrar una notificación de error al usuario
    } finally {
      setWordLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calcular totales para el resumen
  const leadershipPractices = categorySummary.filter(cat =>
    LEADERSHIP_PRACTICES.some(
      practice =>
        practice.name.toLowerCase().includes(cat.category.toLowerCase()) || cat.category.toLowerCase().includes(practice.name.toLowerCase())
    )
  );

  return (
    <Box
      sx={{
        width: '216mm',
        mx: 'auto',
        p: { xs: 1, md: 2 },
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        '@media print': {
          backgroundColor: 'white',
          p: 0,
        },
      }}
    >
      {/* Botones de exportación */}
      <Box
        data-testid="export-buttons"
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          justifyContent: 'center',
          p: 2,
          '@media print': { display: 'none' },
        }}
      >
        <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportToPDF} disabled={pdfLoading}>
          {pdfLoading ? 'Generando...' : 'PDF V1'}
        </Button>

        <Box sx={{ display: 'none' }}>
          <PuppeteerPDFExport teamName={teamName} disabled={pdfLoading} />
        </Box>

        {/* Solo permitir exportar en formato carta */}
        <SimplePDFExporter />

        <Button variant="outlined" startIcon={<WordIcon />} onClick={handleExportToWord} disabled={wordLoading}>
          {wordLoading ? 'Generando...' : 'Exportar Word'}
        </Button>

        <Button sx={{ display: 'none' }} variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
          Imprimir
        </Button>
      </Box>

      {/* Loading del PDF */}
      {pdfLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              p: 4,
              minWidth: 300,
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: palette.primary.main, fontWeight: 600 }}>
              Generando PDF
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
              Procesando página {currentPdfPage} de {totalPdfPages}
            </Typography>
            <Box sx={{ width: '100%', mb: 2 }}>
              <div
                style={{
                  width: '100%',
                  height: 8,
                  backgroundColor: '#e0e0e0',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    backgroundColor: palette.primary.main,
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                    width: totalPdfPages > 0 ? `${(currentPdfPage / totalPdfPages) * 100}%` : '0%',
                  }}
                />
              </div>
            </Box>
            <Typography variant="caption" sx={{ color: '#999' }}>
              Por favor espera mientras se genera tu documento...
            </Typography>
          </Box>
        </Box>
      )}
      {/* Loading del Word */}
      {wordLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              p: 4,
              minWidth: 300,
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: palette.primary.main, fontWeight: 600 }}>
              Generando Word
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
              Preparando y empaquetando el documento. Por favor espera...
            </Typography>
            <Box sx={{ width: '100%', mb: 2 }}>
              <div
                style={{
                  width: '100%',
                  height: 8,
                  backgroundColor: '#e0e0e0',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    backgroundColor: palette.primary.main,
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                    width: '60%',
                  }}
                />
              </div>
            </Box>
            <Typography variant="caption" sx={{ color: '#999' }}>
              Por favor espera mientras se genera tu documento...
            </Typography>
          </Box>
        </Box>
      )}
      <div id="pdf-pages-only" style={{ background: 'white', width: '100%' }}>
        {/* ==================== CARÁTULA ==================== */}
        <Paper sx={{ ...pageStyle, p: 0 }} className="caratula" data-testid="page">
          <Box
            sx={{
              height: '279mm',
              width: '216mm',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#fafafa',
            }}
          >
            {/* Header corporativo con líneas geométricas */}
            <Box
              sx={{
                height: '80px',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '20px',
                  background:
                    'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 41%, rgba(255,255,255,0.1) 59%, transparent 60%)',
                },
              }}
            />

            {/* Logo y marca superior */}
            <Box sx={{ position: 'absolute', top: 3, left: 4, right: 4, zIndex: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pt: 2 }}>
                <Box
                  sx={{
                    width: 120,
                    height: 60,
                    backgroundColor: 'white',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '2px solid #e3f2fd',
                  }}
                >
                  <CardMedia component="img" image="/ho_logo.jpg" sx={{ width: 100, height: 'auto', maxHeight: 50 }} />
                </Box>
              </Box>
            </Box>

            {/* Contenido principal centralizado */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                px: 6,
                py: 8,
                textAlign: 'center',
                mt: 4,
              }}
            >
              {/* Título principal con diseño corporativo */}
              <Box
                sx={{
                  mb: 6,
                  p: 4,
                  backgroundColor: 'white',
                  borderRadius: 3,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  border: '1px solid #e0e0e0',
                  maxWidth: '500px',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '6px',
                    background: 'linear-gradient(90deg, #1976d2, #42a5f5, #1976d2)',
                    borderRadius: '3px 3px 0 0',
                  },
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: palette.primary.main,
                    mb: 1,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                  }}
                >
                  INVENTARIO DE
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: '#0d47a1',
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                  }}
                >
                  PRÁCTICAS DE LIDERAZGO
                </Typography>
              </Box>

              {/* Información del equipo con diseño elegante */}
              <Box
                sx={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: 4,
                  p: 4,
                  mb: 4,
                  maxWidth: '480px',
                  width: '100%',
                  border: '2px solid #e3f2fd',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '6px',
                    height: '100%',
                    background: 'linear-gradient(180deg, #1976d2, #42a5f5)',
                  },
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color: palette.primary.main,
                    mb: 2,
                    fontSize: '1.8rem',
                  }}
                >
                  {teamName}
                </Typography>
                {teamLeader && (
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'primary.light',
                      fontWeight: 400,
                      lineHeight: 1.4,
                      fontSize: '1.1rem',
                    }}
                  >
                    Líder: {teamLeader}
                  </Typography>
                )}
                <Typography
                  variant="h6"
                  sx={{
                    color: '#546e7a',
                    fontWeight: 400,
                    lineHeight: 1.4,
                    fontSize: '1.1rem',
                  }}
                >
                  Análisis Comparativo de las Cinco Prácticas de Liderazgo
                </Typography>
              </Box>

              {/* Elementos decorativos geométricos */}
              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                {[0, 1, 2, 3, 4].map(index => (
                  <Box
                    key={index}
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: index === 2 ? palette.primary.main : '#e3f2fd',
                      transform: index === 2 ? 'scale(1.5)' : 'scale(1)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Footer corporativo */}
            <Box
              sx={{
                backgroundColor: 'white',
                borderTop: '3px solid #1976d2',
                py: 3,
                px: 4,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 2,
                  p: 2,
                  border: '1px solid #e0e0e0',
                }}
              >
                {/* Icono de calendario elegante */}
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    backgroundColor: palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.89-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                      fill="white"
                    />
                  </svg>
                </Box>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#546e7a',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Fecha de Elaboración
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: palette.primary.main,
                      fontWeight: 600,
                      fontSize: '1.1rem',
                    }}
                  >
                    {new Date().toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Elementos decorativos de fondo */}
            <Box
              sx={{
                position: 'absolute',
                top: '20%',
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                border: '2px solid #e3f2fd',
                opacity: 0.3,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: '25%',
                left: -30,
                width: 100,
                height: 100,
                borderRadius: '50%',
                border: '2px solid #e3f2fd',
                opacity: 0.2,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '70%',
                width: 80,
                height: 80,
                transform: 'rotate(45deg)',
                border: '2px solid #e3f2fd',
                opacity: 0.15,
              }}
            />
          </Box>
        </Paper>

        {/* ==================== PÁGINA 1: RESUMEN EJECUTIVO ==================== */}
        <Paper sx={pageStyle} className="pagina-comun" data-testid="page">
          {/* Encabezado simplificado */}
          <Box
            sx={{
              backgroundColor: '#f8fafc',
              borderLeft: '6px solid #2563eb',
              padding: '15px 25px',
              marginBottom: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '600',
                color: '#1e293b',
                textAlign: 'center',
              }}
            >
              Resumen Ejecutivo
            </Typography>
            {/* <Typography
            variant="body1"
            sx={{
              color: '#64748b',
              textAlign: 'center',
              mt: 1,
              fontSize: '14px',
            }}
          >
            Análisis comparativo de prácticas de liderazgo
          </Typography> */}
          </Box>

          <Typography
            variant="h6"
            sx={{
              mb: 3,
              color: 'text.secondary',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            Cinco Prácticas de Liderazgo - Análisis Comparativo
          </Typography>

          {/* Información del equipo en tarjeta corporativa */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              padding: '20px',
              mb: 4,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Línea decorativa */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #1e3a8a 0%, #0369a1 100%)',
              }}
            />

            <Grid container spacing={3}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 1 }}>
                  <strong style={{ color: '#1e3a8a' }}>Equipo:</strong> {teamName}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                  <strong style={{ color: '#1e3a8a' }}>Período:</strong>{' '}
                  {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="body2" sx={{ fontSize: '0.9rem', mb: 1 }}>
                  <strong style={{ color: '#1e3a8a' }}>Total preguntas:</strong> {comparativeData.length}
                </Typography>
                {/* <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                <strong style={{ color: '#1e3a8a' }}>Evaluadores:</strong> Autopercepción + Observadores
              </Typography> */}
              </Grid>
            </Grid>
          </Box>

          {/* Tabla comparativa principal simplificada */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: '600',
                fontSize: '18px',
                color: '#374151',
                mb: 2,
                textAlign: 'center',
              }}
            >
              Cuadro Comparativo - Autopercepción vs Percepción de Colaboradores
            </Typography>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                border: '1px solid #d1d5db',
                borderRadius: '8px',
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                    <TableCell
                      sx={{
                        color: '#374151',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        borderBottom: '2px solid #e5e7eb',
                        py: 1.5,
                      }}
                    >
                      Práctica de Liderazgo
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: '#374151',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        borderBottom: '2px solid #e5e7eb',
                        py: 1.5,
                        minWidth: '100px',
                      }}
                    >
                      Autopercepción
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: '#374151',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        borderBottom: '2px solid #e5e7eb',
                        py: 1.5,
                        minWidth: '100px',
                      }}
                    >
                      Observadores
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: '#374151',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        borderBottom: '2px solid #e5e7eb',
                        py: 1.5,
                        minWidth: '90px',
                      }}
                    >
                      Diferencia
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leadershipPractices.length > 0 ? (
                    leadershipPractices.map((practice, index) => {
                      const difference = practice.otros_total - practice.auto_total;
                      return (
                        <TableRow
                          key={index}
                          sx={{
                            '&:nth-of-type(odd)': {
                              backgroundColor: '#f8fafc',
                            },
                            '&:hover': {
                              backgroundColor: '#e2e8f0',
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              maxWidth: '200px',
                              color: '#1e3a8a',
                              borderRight: '1px solid #e2e8f0',
                              padding: '12px 8px',
                            }}
                          >
                            {practice.category}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color: palette.primary.main,
                              fontWeight: '700',
                              fontSize: '1rem',
                              borderRight: '1px solid #e2e8f0',
                              backgroundColor: index % 2 === 0 ? 'rgba(25, 118, 210, 0.05)' : 'inherit',
                              padding: '12px 8px',
                            }}
                          >
                            {practice.auto_total.toFixed(1)}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color: palette.secondary.main,
                              fontWeight: '700',
                              fontSize: '1rem',
                              borderRight: '1px solid #e2e8f0',
                              backgroundColor: index % 2 === 0 ? 'rgba(211, 47, 47, 0.05)' : 'inherit',
                              padding: '12px 8px',
                            }}
                          >
                            {practice.otros_total.toFixed(1)}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontWeight: '700',
                              fontSize: '1rem',
                              color: difference > 0 ? palette.success.main : difference < 0 ? palette.error.main : '#1e3a8a',
                              backgroundColor:
                                difference > 0
                                  ? 'rgba(46, 125, 50, 0.1)'
                                  : difference < 0
                                  ? 'rgba(211, 47, 47, 0.1)'
                                  : 'rgba(30, 58, 138, 0.05)',
                              padding: '12px 8px',
                              borderRadius: difference !== 0 ? '4px' : 'inherit',
                            }}
                          >
                            {difference > 0 ? '+' : ''}
                            {difference.toFixed(1)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{
                          fontSize: '0.9rem',
                          color: '#64748b',
                          fontStyle: 'italic',
                          padding: '20px',
                        }}
                      >
                        No se encontraron prácticas de liderazgo definidas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Interpretación inicial simplificada */}
          <Box
            sx={{
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '20px',
              borderLeft: '4px solid #3b82f6',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                mb: 2,
                display: 'none',
              }}
            >
              Interpretación
            </Typography>

            <Typography
              variant="body2"
              sx={{
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: '#6b7280',
              }}
            >
              Este cuadro presenta la comparación entre la <strong>autopercepción del líder</strong> y la{' '}
              <strong>percepción de sus colaboradores</strong> en las cinco prácticas fundamentales del liderazgo. Las{' '}
              <span style={{ color: palette.success.main, fontWeight: '600' }}>diferencias negativas</span> indican que el líder se percibe
              con mayor competencia, mientras que las{' '}
              <span style={{ color: palette.error.main, fontWeight: '600' }}>diferencias positivas</span> sugieren que los colaboradores ven
              áreas con oportunidades de mejora. Esta información es crucial para identificar brechas en la percepción y enfocar los
              esfuerzos de desarrollo del liderazgo.
            </Typography>
          </Box>
        </Paper>
        {/* ==================== PÁGINA 1.1: RESUMEN EJECUTIVO ==================== */}
        {hasSupervisorData && (
          <Paper sx={pageStyle} className="pagina-comun" data-testid="page">
            {/* Tabla comparativa principal simplificada */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: '600',
                  fontSize: '18px',
                  color: '#374151',
                  mb: 2,
                  textAlign: 'center',
                }}
              >
                Cuadro Comparativo - Autopercepción vs Percepción del líder de líder de equipo
              </Typography>

              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                      <TableCell
                        sx={{
                          color: '#374151',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          borderBottom: '2px solid #e5e7eb',
                          py: 1.5,
                        }}
                      >
                        Práctica de Liderazgo
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: '#374151',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          borderBottom: '2px solid #e5e7eb',
                          py: 1.5,
                          minWidth: '100px',
                        }}
                      >
                        Autopercepción
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: '#374151',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          borderBottom: '2px solid #e5e7eb',
                          py: 1.5,
                          minWidth: '100px',
                        }}
                      >
                        Líder de Líder
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: '#374151',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          borderBottom: '2px solid #e5e7eb',
                          py: 1.5,
                          minWidth: '90px',
                        }}
                      >
                        Diferencia
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leadershipPractices.length > 0 ? (
                      leadershipPractices.map((practice, index) => {
                        const difference = practice.supervisor_total - practice.auto_total;
                        return (
                          <TableRow
                            key={index}
                            sx={{
                              '&:nth-of-type(odd)': {
                                backgroundColor: '#f8fafc',
                              },
                              '&:hover': {
                                backgroundColor: '#e2e8f0',
                              },
                            }}
                          >
                            <TableCell
                              sx={{
                                fontWeight: '600',
                                fontSize: '0.85rem',
                                maxWidth: '200px',
                                color: '#1e3a8a',
                                borderRight: '1px solid #e2e8f0',
                                padding: '12px 8px',
                              }}
                            >
                              {practice.category}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                color: palette.primary.main,
                                fontWeight: '700',
                                fontSize: '1rem',
                                borderRight: '1px solid #e2e8f0',
                                backgroundColor: index % 2 === 0 ? 'rgba(25, 118, 210, 0.05)' : 'inherit',
                                padding: '12px 8px',
                              }}
                            >
                              {practice.auto_total.toFixed(1)}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                color: palette.supervisor.main,
                                fontWeight: '700',
                                fontSize: '1rem',
                                borderRight: '1px solid #e2e8f0',
                                backgroundColor: index % 2 === 0 ? 'rgba(211, 47, 47, 0.05)' : 'inherit',
                                padding: '12px 8px',
                              }}
                            >
                              {practice.supervisor_total.toFixed(1)}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontWeight: '700',
                                fontSize: '1rem',
                                color: difference > 0 ? palette.success.main : difference < 0 ? palette.error.main : '#1e3a8a',
                                backgroundColor:
                                  difference > 0
                                    ? 'rgba(46, 125, 50, 0.1)'
                                    : difference < 0
                                    ? 'rgba(211, 47, 47, 0.1)'
                                    : 'rgba(30, 58, 138, 0.05)',
                                padding: '12px 8px',
                                borderRadius: difference !== 0 ? '4px' : 'inherit',
                              }}
                            >
                              {difference > 0 ? '+' : ''}
                              {difference.toFixed(1)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          align="center"
                          sx={{
                            fontSize: '0.9rem',
                            color: '#64748b',
                            fontStyle: 'italic',
                            padding: '20px',
                          }}
                        >
                          No se encontraron prácticas de liderazgo definidas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Interpretación inicial simplificada */}
            <Box
              sx={{
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '20px',
                borderLeft: '4px solid #3b82f6',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151',
                  mb: 2,
                  display: 'none',
                }}
              >
                Interpretación
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: '#6b7280',
                }}
              >
                Este cuadro presenta la comparación entre la <strong>autopercepción del líder</strong> y la{' '}
                <strong>percepción de su superior</strong> en las cinco prácticas fundamentales del liderazgo. Las{' '}
                <span style={{ color: palette.success.main, fontWeight: '600' }}>diferencias negativas</span> indican que el líder se
                percibe con mayor competencia, mientras que las{' '}
                <span style={{ color: palette.error.main, fontWeight: '600' }}>diferencias positivas</span> sugieren que su superior ve
                áreas con oportunidades de mejora. Esta información es crucial para identificar brechas en la percepción y enfocar los
                esfuerzos de desarrollo del liderazgo.
              </Typography>
            </Box>
          </Paper>
        )}

        {/* ==================== PÁGINA 2: ANÁLISIS GRÁFICO ==================== */}
        <Paper sx={pageStyle} data-testid="page" className="pagina-comun">
          {/* Encabezado simplificado */}
          <Box
            sx={{
              backgroundColor: '#f8fafc',
              borderLeft: '6px solid #2563eb',
              padding: '20px 25px',
              marginBottom: '25px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '600',
                color: '#1e293b',
                textAlign: 'center',
              }}
            >
              Análisis Gráfico Comparativo
            </Typography>
          </Box>

          {leadershipPractices.length > 0 && (
            <Box
              sx={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                padding: '20px',
                mb: 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <Box sx={{ height: '380px' }} ref={lineChartRef}>
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart
                    data={leadershipPractices.map((practice, index) => ({
                      practica: practice.category.length > 20 ? practice.category.substring(0, 17) + '...' : practice.category,
                      AUTO: Number(practice.auto_total.toFixed(1)),
                      OBSERVADORES: Number(practice.otros_total.toFixed(1)),
                      SUPERVISORES: Number(((practice as { supervisor_total?: number }).supervisor_total ?? 0).toFixed(1)),
                      index: index + 1,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis
                      dataKey="practica"
                      tick={{ fontSize: 9, textAnchor: 'end', fill: '#475569' }}
                      angle={-30}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis
                      domain={[15, 30]}
                      tick={{ fontSize: 10, fill: '#475569' }}
                      tickCount={6}
                      label={{
                        value: 'Puntuación',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#1e3a8a', fontWeight: '600' },
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      labelFormatter={label => label}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '2px solid #1e3a8a',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: '12px',
                        paddingTop: '20px',
                        fontWeight: '600',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="AUTO"
                      stroke={palette.primary.main}
                      strokeWidth={4}
                      dot={{ fill: palette.primary.main, strokeWidth: 3, r: 3 }}
                      activeDot={{ r: 8, fill: palette.primary.main, strokeWidth: 3, stroke: '#fff' }}
                      label={{ position: 'top', fontSize: 10, fill: palette.primary.main, fontWeight: '600' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="OBSERVADORES"
                      stroke={palette.secondary.main}
                      strokeWidth={4}
                      dot={{ fill: palette.secondary.main, strokeWidth: 3, r: 3 }}
                      activeDot={{ r: 8, fill: palette.secondary.main, strokeWidth: 3, stroke: '#fff' }}
                      label={{ position: 'bottom', fontSize: 10, fill: palette.secondary.main, fontWeight: '600' }}
                    />
                    {hasSupervisorData && (
                      <Line
                        type="monotone"
                        dataKey="SUPERVISORES"
                        stroke={palette.supervisor.main}
                        strokeWidth={4}
                        dot={{ fill: palette.supervisor.main, strokeWidth: 3, r: 3 }}
                        activeDot={{ r: 8, fill: palette.supervisor.main, strokeWidth: 3, stroke: '#fff' }}
                        label={{ position: 'top', fontSize: 10, fill: palette.supervisor.main, fontWeight: '600' }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          )}

          {/* Interpretación del análisis simplificada */}
          <Box
            sx={{
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '20px',
              borderLeft: '4px solid #3b82f6',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151',
                mb: 2,
                display: 'none',
              }}
            >
              Interpretación del Análisis
            </Typography>

            <Typography
              variant="body2"
              sx={{
                fontSize: '0.9rem',
                lineHeight: 1.6,
                mb: 2,
                color: '#6b7280',
              }}
            >
              <strong>El gráfico de líneas</strong> facilita la visualización de las diferencias entre autopercepción y percepción externa
              en cada práctica.{' '}
              {hasSupervisorData ? (
                <>
                  <span style={{ color: palette.primary.main, fontWeight: '600' }}> Las líneas azules (autopercepción),</span>
                  <span style={{ color: palette.secondary.main, fontWeight: '600' }}> moradas (observadores)</span>
                  <span style={{ color: palette.supervisor.main, fontWeight: '600' }}> y naranjas (líder de líder)</span> permiten
                  identificar rápidamente:
                </>
              ) : (
                <>
                  <span style={{ color: palette.primary.main, fontWeight: '600' }}> Las líneas azules (autopercepción)</span> y
                  <span style={{ color: palette.secondary.main, fontWeight: '600' }}> moradas (observadores)</span> permiten identificar
                  rápidamente:
                </>
              )}
            </Typography>

            <Box
              component="ul"
              sx={{
                margin: 0,
                paddingLeft: '20px',
                '& li': {
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  marginBottom: '8px',
                  color: '#6b7280',
                  fontWeight: '500',
                },
              }}
            >
              <li>
                <strong>Convergencias:</strong> Donde ambas líneas se aproximan, indicando alineación perceptual
              </li>
              <li>
                <strong>Divergencias:</strong> Separaciones significativas que requieren atención y desarrollo
              </li>
            </Box>
          </Box>
        </Paper>

        {/* ==================== PÁGINAS SIGUIENTES: DETALLE POR CATEGORÍA ==================== */}
        {categoryData.map((category, categoryIndex) => {
          const practiceInfo = LEADERSHIP_PRACTICES.find(
            practice =>
              practice.name.toLowerCase().includes(category.category.name.toLowerCase()) ||
              category.category.name.toLowerCase().includes(practice.name.toLowerCase())
          );

          return (
            <>
              {/* PÁGINA A: TÍTULO, DESCRIPCIÓN Y GRÁFICO */}
              <Paper key={`${categoryIndex}-graph`} sx={pageStyle} data-testid="page" className="pagina-comun">
                {/* Encabezado simplificado */}
                <Box
                  sx={{
                    backgroundColor: '#f8fafc',
                    borderLeft: '6px solid #2563eb',
                    padding: '15px 25px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: '600',
                      color: '#1e293b',
                      textAlign: 'center',
                      mb: 1,
                    }}
                  >
                    {category.category.name}
                  </Typography>
                  {practiceInfo && practiceInfo.description && (
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        color: '#6b7280',
                        whiteSpace: 'break-spaces',
                      }}
                    >
                      {practiceInfo.description}
                    </Typography>
                  )}
                </Box>

                {/* Descripción de la práctica simplificada */}
                {practiceInfo && practiceInfo.description && (
                  <Box
                    sx={{
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      padding: '20px',
                      mb: 4,
                      borderLeft: '4px solid #3b82f6',
                      display: 'none',
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        color: '#6b7280',
                        whiteSpace: 'break-spaces',
                      }}
                    >
                      {practiceInfo.description}
                    </Typography>
                  </Box>
                )}

                {/* Gráfico comparativo simplificado */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: '600',
                      fontSize: '18px',
                      color: '#374151',
                      mb: 2,
                      textAlign: 'center',
                    }}
                  >
                    Análisis Comparativo por Pregunta
                  </Typography>

                  <Box
                    sx={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      padding: '20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    <Box
                      sx={{ height: '425px' }}
                      ref={el => {
                        barChartRefs.current[categoryIndex] = el as HTMLDivElement | null;
                      }}
                    >
                      <ResponsiveContainer width="100%" height={'100%'}>
                        <BarChart
                          data={category.questions.map(q => ({
                            pregunta:
                              q.question_text.length > 300
                                ? q.question_number + '. ' + q.question_text.slice(0, 300) + '...'
                                : q.question_number + '. ' + q.question_text,
                            AUTO: q.leader_avg,
                            OBSERVADORES: q.collaborator_avg.toFixed(1),
                            SUPERVISORES: q.supervisor_avg,
                          }))}
                          layout="vertical"
                          margin={{ top: 20, right: 40, left: 10, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                          <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#475569' }} tickCount={6} />
                          <YAxis type="category" dataKey="pregunta" tick={{ fontSize: 10, width: 160, fill: '#475569' }} width={300} />
                          <Tooltip
                            formatter={(value, name) => [value, name]}
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '2px solid #1e3a8a',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '600',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                          <Legend
                            wrapperStyle={{
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                          />
                          <Bar
                            label={{ position: 'right', fontSize: 10, fill: palette.primary.main, fontWeight: '600' }}
                            dataKey="AUTO"
                            fill={palette.primary.main}
                            name="AUTOPERCEPCIÓN"
                            barSize={hasSupervisorData ? 12 : 20}
                          />
                          {hasSupervisorData && (
                            <Bar
                              dataKey="SUPERVISORES"
                              fill={palette.supervisor.main}
                              name="LÍDER DE LÍDER"
                              label={{ position: 'right', fontSize: 10, fill: palette.supervisor.main, fontWeight: '600' }}
                              barSize={hasSupervisorData ? 12 : 20}
                            />
                          )}
                          <Bar
                            dataKey="OBSERVADORES"
                            fill={palette.secondary.main}
                            name="OBSERVADORES"
                            label={{ position: 'right', fontSize: 10, fill: palette.secondary.main, fontWeight: '600' }}
                            barSize={hasSupervisorData ? 12 : 20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Box>

                {/* Interpretación del gráfico simplificada */}
                <Box
                  sx={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    padding: '20px',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#374151',
                      mb: 2,
                      display: 'none',
                    }}
                  >
                    Interpretación del Análisis
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      color: '#6b7280',
                    }}
                  >
                    Este gráfico muestra la comparación entre la <strong>autopercepción del líder</strong>{' '}
                    {hasSupervisorData && (
                      <>
                        , la <strong>percepción del líder de líder</strong>
                      </>
                    )}{' '}
                    y la <strong>percepción de los colaboradores</strong> para cada pregunta específica de la práctica{' '}
                    <span style={{ color: palette.success.main, fontWeight: '600' }}>{category.category.name}</span>. Las barras permiten
                    identificar preguntas con mayor o menor alineación perceptual.
                  </Typography>
                </Box>
              </Paper>

              {/* PÁGINA B: CUADRO DETALLADO */}
              <Paper key={`${categoryIndex}-table`} sx={pageStyle} data-testid="page">
                {/* Encabezado compacto */}
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#374151',
                    textAlign: 'center',
                    mb: 2,
                    pb: 1,
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  Detalle por Pregunta - {category.category.name}
                </Typography>

                {/* Tabla detallada compacta */}
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    mb: 3,
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#0369a1' }}>
                        <TableCell
                          sx={{
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            width: '60px',
                            borderRight: '1px solid rgba(255,255,255,0.2)',
                            letterSpacing: '0.5px',
                            p: 1,
                          }}
                        >
                          No.
                        </TableCell>
                        <TableCell
                          sx={{
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            borderRight: '1px solid rgba(255,255,255,0.2)',
                            letterSpacing: '0.5px',
                            p: 1,
                          }}
                        >
                          PREGUNTA
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            width: '100px',
                            borderRight: '1px solid rgba(255,255,255,0.2)',
                            letterSpacing: '0.5px',
                            p: 1,
                          }}
                        >
                          AUTOPERCEPCIÓN
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            width: '110px',
                            borderRight: '1px solid rgba(255,255,255,0.2)',
                            letterSpacing: '0.5px',
                            p: 1,
                          }}
                        >
                          OBSERVADORES
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            width: '90px',
                            letterSpacing: '0.5px',
                            p: 1,
                          }}
                        >
                          DIFERENCIA
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {category.questions.map((question, qIndex) => {
                        const difference = question.collaborator_avg - question.leader_avg;
                        return (
                          <TableRow
                            key={qIndex}
                            sx={{
                              '&:nth-of-type(odd)': {
                                backgroundColor: '#f8fafc',
                              },
                              '&:hover': {
                                backgroundColor: '#e2e8f0',
                              },
                            }}
                          >
                            <TableCell
                              sx={{
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1,
                                fontWeight: '600',
                                color: '#374151',
                                textAlign: 'center',
                                minWidth: '35px',
                              }}
                            >
                              {question.question_number}
                            </TableCell>
                            <TableCell
                              sx={{
                                fontSize: '0.75rem',
                                py: 0.5,
                                px: 1.5,
                                lineHeight: 1.2,
                                color: '#374151',
                              }}
                            >
                              {question.question_text}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                color: '#2563eb',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                py: 0.5,
                                px: 1,
                              }}
                            >
                              {question.leader_avg.toFixed(1)}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                color: palette.secondary.main,
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                py: 0.5,
                                px: 1,
                              }}
                            >
                              {question.collaborator_avg.toFixed(1)}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                py: 0.5,
                                px: 1,
                                color: difference > 0 ? palette.success.main : difference < 0 ? palette.error.main : '#6b7280',
                              }}
                            >
                              {difference > 0 ? '+' : ''}
                              {difference.toFixed(1)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Resumen de la categoría simplificado */}
                <Box
                  sx={{
                    mt: 4,
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    padding: '20px',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#374151',
                      mb: 2,
                    }}
                  >
                    Resumen de la Práctica
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 4 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: '700',
                          color: '#065f46',
                          fontSize: '0.9rem',
                          mb: 1,
                        }}
                      >
                        Promedio Autopercepción:
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color: palette.primary.main,
                          fontWeight: '700',
                          fontSize: '1.2rem',
                        }}
                      >
                        {(category.questions.reduce((sum, q) => sum + q.leader_avg, 0) / category.questions.length).toFixed(1)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: '700',
                          color: '#065f46',
                          fontSize: '0.9rem',
                          mb: 1,
                        }}
                      >
                        Promedio Observadores:
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color: palette.secondary.main,
                          fontWeight: '700',
                          fontSize: '1.2rem',
                        }}
                      >
                        {(category.questions.reduce((sum, q) => sum + q.collaborator_avg, 0) / category.questions.length).toFixed(1)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: '700',
                          color: '#065f46',
                          fontSize: '0.9rem',
                          mb: 1,
                        }}
                      >
                        Diferencia Promedio:
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color:
                            category.questions.reduce((sum, q) => sum + (q.collaborator_avg - q.leader_avg), 0) /
                              category.questions.length >
                            0
                              ? palette.success.main
                              : palette.error.main,
                          fontWeight: '700',
                          fontSize: '1.2rem',
                        }}
                      >
                        {category.questions.reduce((sum, q) => sum + (q.collaborator_avg - q.leader_avg), 0) / category.questions.length > 0
                          ? '+'
                          : ''}
                        {(
                          category.questions.reduce((sum, q) => sum + (q.collaborator_avg - q.leader_avg), 0) / category.questions.length
                        ).toFixed(1)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
              {hasSupervisorData && (
                <Paper key={`${categoryIndex}-table`} sx={pageStyle} data-testid="page">
                  {/* Encabezado compacto */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#374151',
                      textAlign: 'center',
                      mb: 2,
                      pb: 1,
                      borderBottom: '2px solid #e5e7eb',
                    }}
                  >
                    Detalle por Pregunta - {category.category.name} (Líder de Líder)
                  </Typography>

                  {/* Tabla detallada compacta */}
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      mb: 3,
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#0369a1' }}>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '0.9rem',
                              width: '60px',
                              borderRight: '1px solid rgba(255,255,255,0.2)',
                              letterSpacing: '0.5px',
                              p: 1,
                            }}
                          >
                            No.
                          </TableCell>
                          <TableCell
                            sx={{
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '0.9rem',
                              borderRight: '1px solid rgba(255,255,255,0.2)',
                              letterSpacing: '0.5px',
                              p: 1,
                            }}
                          >
                            PREGUNTA
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '0.9rem',
                              width: '100px',
                              borderRight: '1px solid rgba(255,255,255,0.2)',
                              letterSpacing: '0.5px',
                              p: 1,
                            }}
                          >
                            AUTOPERCEPCIÓN
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '0.9rem',
                              width: '110px',
                              borderRight: '1px solid rgba(255,255,255,0.2)',
                              letterSpacing: '0.5px',
                              p: 1,
                            }}
                          >
                            LÍDER DE LÍDER
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '0.9rem',
                              width: '90px',
                              letterSpacing: '0.5px',
                              p: 1,
                            }}
                          >
                            DIFERENCIA
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {category.questions.map((question, qIndex) => {
                          const difference = question.supervisor_avg - question.leader_avg;
                          return (
                            <TableRow
                              key={qIndex}
                              sx={{
                                '&:nth-of-type(odd)': {
                                  backgroundColor: '#f8fafc',
                                },
                                '&:hover': {
                                  backgroundColor: '#e2e8f0',
                                },
                              }}
                            >
                              <TableCell
                                sx={{
                                  fontSize: '0.75rem',
                                  py: 0.5,
                                  px: 1,
                                  fontWeight: '600',
                                  color: '#374151',
                                  textAlign: 'center',
                                  minWidth: '35px',
                                }}
                              >
                                {question.question_number}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: '0.75rem',
                                  py: 0.5,
                                  px: 1.5,
                                  lineHeight: 1.2,
                                  color: '#374151',
                                }}
                              >
                                {question.question_text}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  color: '#2563eb',
                                  fontWeight: '600',
                                  fontSize: '0.8rem',
                                  py: 0.5,
                                  px: 1,
                                }}
                              >
                                {question.leader_avg.toFixed(1)}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  color: palette.error.main,
                                  fontWeight: '600',
                                  fontSize: '0.8rem',
                                  py: 0.5,
                                  px: 1,
                                }}
                              >
                                {question.collaborator_avg.toFixed(1)}
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{
                                  fontWeight: '600',
                                  fontSize: '0.8rem',
                                  py: 0.5,
                                  px: 1,
                                  color: difference > 0 ? palette.success.main : difference < 0 ? palette.error.main : '#6b7280',
                                }}
                              >
                                {difference > 0 ? '+' : ''}
                                {difference.toFixed(1)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Resumen de la categoría simplificado */}
                  <Box
                    sx={{
                      mt: 4,
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      padding: '20px',
                      borderLeft: '4px solid #3b82f6',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#374151',
                        mb: 2,
                      }}
                    >
                      Resumen de la Práctica
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid size={{ xs: 4 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: '700',
                            color: '#065f46',
                            fontSize: '0.9rem',
                            mb: 1,
                          }}
                        >
                          Promedio Autopercepción:
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            color: palette.primary.main,
                            fontWeight: '700',
                            fontSize: '1.2rem',
                          }}
                        >
                          {(category.questions.reduce((sum, q) => sum + q.leader_avg, 0) / category.questions.length).toFixed(1)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: '700',
                            color: '#065f46',
                            fontSize: '0.9rem',
                            mb: 1,
                          }}
                        >
                          Promedio Líder de Líder:
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            color: palette.supervisor.main,
                            fontWeight: '700',
                            fontSize: '1.2rem',
                          }}
                        >
                          {(category.questions.reduce((sum, q) => sum + q.collaborator_avg, 0) / category.questions.length).toFixed(1)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: '700',
                            color: '#065f46',
                            fontSize: '0.9rem',
                            mb: 1,
                          }}
                        >
                          Diferencia Promedio:
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            color:
                              category.questions.reduce((sum, q) => sum + (q.collaborator_avg - q.leader_avg), 0) /
                                category.questions.length >
                              0
                                ? palette.success.main
                                : palette.error.main,
                            fontWeight: '700',
                            fontSize: '1.2rem',
                          }}
                        >
                          {category.questions.reduce((sum, q) => sum + (q.collaborator_avg - q.leader_avg), 0) / category.questions.length >
                          0
                            ? '+'
                            : ''}
                          {(
                            category.questions.reduce((sum, q) => sum + (q.collaborator_avg - q.leader_avg), 0) / category.questions.length
                          ).toFixed(1)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              )}
            </>
          );
        })}
      </div>
    </Box>
  );
}
