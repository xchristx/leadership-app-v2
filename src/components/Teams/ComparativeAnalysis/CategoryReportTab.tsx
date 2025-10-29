// ============================================================================
// COMPONENTE CATEGORY REPORT TAB
// ============================================================================
// Pestaña de análisis por categorías en modo reporte estructurado para exportación
// ============================================================================

import { Box, Typography, Alert, Button, useTheme } from '@mui/material';
import { Description as WordIcon } from '@mui/icons-material';
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
import SimplePDFExporter from '../../PDF/SimplePDFExporter';
import { useRef, useState } from 'react';
import type { CategoryData, CategorySummary, ComparativeData } from './types';
import Cover from './CategoryReportTab/Cover';
import ExecutiveSumary from './CategoryReportTab/ExecutiveSumary';
// import ExecutiveSumarySuper from './CategoryReportTab/ExecutiveSumarySuper';
import GeneralGraphicAnalysis from './CategoryReportTab/GeneralGraphicAnalysis';
import PageByCategory from './CategoryReportTab/PageByCategory';
import LoadingWord from './CategoryReportTab/LoadingWord';

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

  const handleExportToWord = async () => {
    try {
      setWordLoading(true);
      // opcional: usar contadores de página si se quiere mostrar progreso más avanzado
      // Capturar gráficos como imágenes
      let lineChartImage: Uint8Array | null = null;
      const barChartImages: (Uint8Array | null)[] = [];

      // helper: fetch image as uint8array (for docx ImageRun)
      const fetchImageAsUint8Array = async (url: string): Promise<Uint8Array | null> => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const buffer = await res.arrayBuffer();
          return new Uint8Array(buffer);
        } catch (e) {
          console.warn('No se pudo obtener imagen:', url, e);
          return null;
        }
      };

      // Intentar obtener logo para la carátula
      const logoImage = await fetchImageAsUint8Array('/ho_logo.jpg');

      // Obtener thumbnails de prácticas (siguiendo la misma lógica de PracticeMedia)
      const fetchPracticeThumb = async (categoryName: string) => {
        const slug = categoryName
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        const png = `/categories/${slug}.png`;
        const jpg = `/categories/${slug}.jpg`;

        const pngData = await fetchImageAsUint8Array(png);
        if (pngData) return { data: pngData, type: 'png' as const };
        const jpgData = await fetchImageAsUint8Array(jpg);
        if (jpgData) return { data: jpgData, type: 'jpg' as const };
        return { data: null as Uint8Array | null, type: null as 'png' | 'jpg' | null };
      };

      const practiceThumbs: { data: Uint8Array | null; type: 'png' | 'jpg' | null }[] = [];
      for (let i = 0; i < categoryData.length; i++) {
        const cat = categoryData[i];
        const thumb = await fetchPracticeThumb(cat.category.name);
        practiceThumbs.push(thumb);
      }

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
              // Logo (si está disponible)
              ...(logoImage
                ? [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: logoImage,
                          transformation: { width: 200, height: 80 },
                          type: 'jpg',
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 300 },
                    }),
                  ]
                : []),
              // Thumbnails de prácticas en la carátula (si existen)
              ...(practiceThumbs && practiceThumbs.length > 0
                ? [
                    new Paragraph({
                      children: practiceThumbs
                        .filter(t => t.data)
                        .map(
                          t =>
                            new ImageRun({
                              data: t.data as Uint8Array,
                              transformation: { width: 56, height: 56 },
                              type: t.type === 'png' ? 'png' : 'jpg',
                            })
                        ),
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 300 },
                    }),
                  ]
                : []),

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
                spacing: { after: 200 },
              }),
              ...(teamLeader
                ? [
                    new Paragraph({
                      children: [new TextRun({ text: 'Líder: ', bold: true }), new TextRun({ text: teamLeader })],
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 400 },
                    }),
                  ]
                : []),
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
              ...(teamLeader
                ? [
                    new Paragraph({
                      children: [new TextRun({ text: 'Líder: ', bold: true }), new TextRun({ text: teamLeader })],
                      spacing: { after: 200 },
                    }),
                  ]
                : []),
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

              // Crear tabla de resumen (editable) que refleje la tabla mostrada en la UI
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
                              children: [new Paragraph({ text: 'DIRECTOR', alignment: AlignmentType.CENTER })],
                              shading: { fill: supervisorHex },
                              width: { size: 16, type: WidthType.PERCENTAGE },
                            }),
                            new DocxTableCell({
                              children: [new Paragraph({ text: 'PROMEDIO (Director, Observadores)', alignment: AlignmentType.CENTER })],
                              shading: { fill: '1976d2' },
                              width: { size: 16, type: WidthType.PERCENTAGE },
                            }),
                          ]
                        : []),
                    ],
                  }),
                  // Filas de datos
                  ...leadershipPractices.map(practice => {
                    const supervisorVal = (practice as { supervisor_total?: number }).supervisor_total ?? 0;
                    const promedio = hasSupervisorData ? ((supervisorVal + practice.otros_total) / 2).toFixed(1) : null;
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
                                    text: supervisorVal.toFixed(1),
                                    alignment: AlignmentType.CENTER,
                                  }),
                                ],
                                shading: { fill: supervisorHex },
                              }),
                              new DocxTableCell({
                                children: [
                                  new Paragraph({
                                    text: promedio ?? '',
                                    alignment: AlignmentType.CENTER,
                                  }),
                                ],
                              }),
                            ]
                          : []),
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
                text: hasSupervisorData
                  ? 'Las diferencias entre la autopercepción del líder, la percepción de sus colaboradores y el Director constituyen una oportunidad para el desarrollo del liderazgo. Analizar estas brechas permite identificar fortalezas, reconocer áreas de mejora y ajustar las prácticas de liderazgo para lograr una mayor coherencia entre la intención y el impacto. Este proceso favorece el crecimiento personal, mejora la comunicación con el equipo y contribuye a un liderazgo más efectivo y consciente.'
                  : 'Las diferencias entre la autopercepción del líder y la percepción de sus colaboradores constituyen una oportunidad para el desarrollo del liderazgo. Analizar estas brechas permite identificar fortalezas, reconocer áreas de mejora y ajustar las prácticas de liderazgo para lograr una mayor coherencia entre la intención y el impacto. Este proceso favorece el crecimiento personal, mejora la comunicación con el equipo y contribuye a un liderazgo más efectivo y consciente.',
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
              // Texto exportado que debe coincidir con el contenido mostrado en GeneralGraphicAnalysis
              new Paragraph({
                children: [
                  new TextRun({ text: 'El gráfico de líneas', bold: true }),
                  new TextRun({
                    text: ' facilita la visualización de las diferencias entre autopercepción y percepción externa en cada práctica. ',
                  }),
                  ...(hasSupervisorData
                    ? [
                        new TextRun({
                          text: 'Las líneas azules (autopercepción), moradas (observadores) y naranjas (DIRECTOR) permiten identificar rápidamente:',
                          break: 0,
                        }),
                      ]
                    : [
                        new TextRun({
                          text: 'Las líneas azules (autopercepción) y moradas (observadores) permiten identificar rápidamente:',
                          break: 0,
                        }),
                      ]),
                ],
                spacing: { after: 200 },
              }),

              new Paragraph({
                text: '• Convergencias: Donde ambas líneas se aproximan, indicando alineación perceptual',
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: '• Divergencias: Separaciones significativas que requieren atención y desarrollo',
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
                  // Thumbnail de la categoría (si existe)
                  ...(practiceThumbs[categoryIndex] && practiceThumbs[categoryIndex].data
                    ? [
                        new Paragraph({
                          children: [
                            new ImageRun({
                              data: practiceThumbs[categoryIndex].data as Uint8Array,
                              transformation: { width: 80, height: 80 },
                              type: practiceThumbs[categoryIndex].type === 'png' ? 'png' : 'jpg',
                            }),
                          ],
                          alignment: AlignmentType.CENTER,
                          spacing: { after: 200 },
                        }),
                      ]
                    : []),
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
                                  children: [new Paragraph({ text: 'DIRECTOR', alignment: AlignmentType.CENTER })],
                                  shading: { fill: 'ff6b35' },
                                  width: { size: 12, type: WidthType.PERCENTAGE },
                                }),
                              ]
                            : []),
                        ],
                      }),
                      // Filas de preguntas (coinciden con la tabla mostrada en PageByCategory)
                      ...category.questions.map(question => {
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
                          ],
                        });
                      }),
                    ],
                  }),

                  // Resumen de la categoría (igual que en la UI)
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
                  ...(hasSupervisorData
                    ? [
                        new Paragraph({
                          children: [
                            new TextRun({ text: 'Promedio Director: ', bold: true }),
                            new TextRun({
                              text: (
                                category.questions.reduce((sum, q) => sum + (q.supervisor_avg ?? 0), 0) / category.questions.length
                              ).toFixed(1),
                            }),
                          ],
                          spacing: { after: 400 },
                        }),
                      ]
                    : []),

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
        {/* Solo permitir exportar en formato carta */}
        <SimplePDFExporter />

        <Button variant="outlined" startIcon={<WordIcon />} onClick={handleExportToWord} disabled={wordLoading}>
          {wordLoading ? 'Generando...' : 'Exportar Word'}
        </Button>
      </Box>

      {/* Loading del Word */}
      {wordLoading && <LoadingWord />}
      <div id="pdf-pages-only" style={{ background: 'white', width: '100%' }}>
        {/* ==================== CARÁTULA ==================== */}
        <Cover pageStyle={pageStyle} teamLeader={teamLeader} teamName={teamName} categoryData={categoryData} />

        {/* ==================== PÁGINA 1: RESUMEN EJECUTIVO ==================== */}
        <ExecutiveSumary
          leaderName={teamLeader}
          pageStyle={pageStyle}
          teamName={teamName}
          comparativeData={comparativeData}
          leadershipPractices={leadershipPractices}
          hasSupervisorData={hasSupervisorData}
        />
        {/* ==================== PÁGINA 1.1: RESUMEN EJECUTIVO ==================== */}

        {/* ==================== PÁGINA 2: ANÁLISIS GRÁFICO ==================== */}

        <GeneralGraphicAnalysis
          hasSupervisorData={hasSupervisorData}
          leadershipPractices={leadershipPractices}
          lineChartRef={lineChartRef}
          pageStyle={pageStyle}
        />
        {/* ==================== PÁGINAS SIGUIENTES: DETALLE POR CATEGORÍA ==================== */}
        <PageByCategory
          LEADERSHIP_PRACTICES={LEADERSHIP_PRACTICES}
          barChartRefs={barChartRefs}
          categoryData={categoryData}
          hasSupervisorData={hasSupervisorData}
          pageStyle={pageStyle}
        />
      </div>
    </Box>
  );
}
