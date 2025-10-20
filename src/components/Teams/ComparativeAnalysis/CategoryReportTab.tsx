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
import { useRef } from 'react';
import type { CategoryData, CategorySummary, ComparativeData } from './types';

interface CategoryReportTabProps {
  categoryData: CategoryData[];
  categorySummary: CategorySummary[];
  comparativeData: ComparativeData[];
  loading: boolean;
  teamName?: string;
}
// Configuración de las 5 prácticas de liderazgo
// const LEADERSHIP_PRACTICES = {
//   'Modelar el Camino': {
//     description:
//       'Las palabras y los planes no son suficientes. El Líder tiene que demostrar sus creencias. Hay que practicar lo que se predica.',
//     color: '#1976d2',
//   },
//   'Inspirar una Visión Compartida': {
//     description: 'Los líderes tienen puesta la mira en el futuro, visiones ideales de cómo quieren que sean las cosas.',
//     color: '#388e3c',
//   },
//   'Desafiar el Proceso': {
//     description:
//       'Los líderes buscan y aceptan las oportunidades de probar sus habilidades. Los líderes experimentan, toman riesgos y aprenden de la experiencia.',
//     color: '#f57c00',
//   },
//   'Capacitar a Otros para la Acción': {
//     description:
//       'Los líderes forman equipos cohesionados, que se sienten como en familia. Los líderes promueven la autoconfianza y el desarrollo de las capacidades.',
//     color: '#7b1fa2',
//   },
//   'Estimular Emotivamente': {
//     description:
//       'Un líder reconoce las contribuciones demostrando aprecio por la excelencia individual. Celebra las victorias y el valor de los miembros del equipo creando espíritu de comunidad.',
//     color: '#c2185b',
//   },
// } as const;

export function CategoryReportTab({
  categoryData,
  categorySummary,
  comparativeData,
  loading,
  teamName = 'Equipo',
}: CategoryReportTabProps) {
  // Referencias para capturar gráficos
  const lineChartRef = useRef<HTMLDivElement>(null);
  const barChartRefs = useRef<(HTMLDivElement | null)[]>([]);

  const LEADERSHIP_PRACTICES = categoryData.map(cat => cat.category);

  console.log({ categoryData, categorySummary });

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

  // Funciones de exportación (placeholder)
  const handleExportToPDF = () => {
    console.log('Exportar a PDF');
    // TODO: Implementar exportación a PDF
  };

  const handleExportToWord = async () => {
    try {
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

              // Insertar gráfico principal si existe
              ...(lineChartImage
                ? [
                    new Paragraph({
                      text: 'Gráfico Comparativo General',
                      heading: HeadingLevel.HEADING_3,
                      spacing: { after: 200 },
                    }),
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
                        children: [new Paragraph({ text: 'PRÁCTICA', alignment: AlignmentType.CENTER })],
                        shading: { fill: '1976d2' },
                        width: { size: 40, type: WidthType.PERCENTAGE },
                      }),
                      new DocxTableCell({
                        children: [new Paragraph({ text: 'AUTO', alignment: AlignmentType.CENTER })],
                        shading: { fill: '1976d2' },
                        width: { size: 20, type: WidthType.PERCENTAGE },
                      }),
                      new DocxTableCell({
                        children: [new Paragraph({ text: 'OBSERVADORES', alignment: AlignmentType.CENTER })],
                        shading: { fill: '1976d2' },
                        width: { size: 20, type: WidthType.PERCENTAGE },
                      }),
                      new DocxTableCell({
                        children: [new Paragraph({ text: 'DIFERENCIA', alignment: AlignmentType.CENTER })],
                        shading: { fill: '1976d2' },
                        width: { size: 20, type: WidthType.PERCENTAGE },
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

                  // Tabla detallada por pregunta
                  new Paragraph({
                    text: 'Análisis Detallado de Cada Pregunta',
                    heading: HeadingLevel.HEADING_2,
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
                            shading: { fill: '1976d2' },
                            width: { size: 10, type: WidthType.PERCENTAGE },
                          }),
                          new DocxTableCell({
                            children: [new Paragraph({ text: 'Pregunta', alignment: AlignmentType.CENTER })],
                            shading: { fill: '1976d2' },
                            width: { size: 50, type: WidthType.PERCENTAGE },
                          }),
                          new DocxTableCell({
                            children: [new Paragraph({ text: 'AUTO', alignment: AlignmentType.CENTER })],
                            shading: { fill: '1976d2' },
                            width: { size: 15, type: WidthType.PERCENTAGE },
                          }),
                          new DocxTableCell({
                            children: [new Paragraph({ text: 'OBSERV.', alignment: AlignmentType.CENTER })],
                            shading: { fill: '1976d2' },
                            width: { size: 15, type: WidthType.PERCENTAGE },
                          }),
                          new DocxTableCell({
                            children: [new Paragraph({ text: 'DIFERENCIA', alignment: AlignmentType.CENTER })],
                            shading: { fill: '1976d2' },
                            width: { size: 10, type: WidthType.PERCENTAGE },
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

                  // Insertar gráfico de barras si existe
                  ...(barChartImages[categoryIndex]
                    ? [
                        new Paragraph({
                          text: 'Gráfico Detallado de la Práctica',
                          heading: HeadingLevel.HEADING_4,
                          spacing: { after: 200 },
                        }),
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
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          justifyContent: 'center',
          p: 2,
          '@media print': { display: 'none' },
        }}
      >
        <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportToPDF} disabled>
          Exportar PDF
        </Button>
        <Button variant="outlined" startIcon={<WordIcon />} onClick={handleExportToWord}>
          Exportar Word
        </Button>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
          Imprimir
        </Button>
      </Box>

      {/* ==================== CARÁTULA ==================== */}
      <Paper sx={{ ...pageStyle, p: 0 }}>
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
                <CardMedia component="img" image="/public/ho_logo.jpg" sx={{ width: 100, height: 'auto', maxHeight: 50 }} />
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
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #1976d2, #42a5f5, #1976d2)',
                  borderRadius: '3px 3px 0 0',
                },
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: '#1976d2',
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
                  color: '#1976d2',
                  mb: 2,
                  fontSize: '1.8rem',
                }}
              >
                {teamName}
              </Typography>
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
                    backgroundColor: index === 2 ? '#1976d2' : '#e3f2fd',
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
                  backgroundColor: '#1976d2',
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
                    color: '#1976d2',
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
      <Paper sx={pageStyle}>
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
            Resumen Ejecutivo
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#64748b',
              textAlign: 'center',
              mt: 1,
              fontSize: '14px',
            }}
          >
            Análisis comparativo de prácticas de liderazgo
          </Typography>
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

        {/* Tarjetas de métricas principales */}
        <Grid container spacing={3} sx={{ mb: 4, display: 'none' }}>
          {/* Puntuación General */}
          <Grid size={{ xs: 6 }}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: '12px',
                border: '2px solid #1e3a8a',
                padding: '25px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                height: '180px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {/* Decoración esquina */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '30px',
                  height: '30px',
                  backgroundColor: '#1e3a8a',
                  clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                }}
              />

              <Box
                sx={{
                  backgroundColor: '#1e3a8a',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '15px',
                  display: 'inline-block',
                  letterSpacing: '0.5px',
                  mx: 'auto',
                }}
              >
                PUNTUACIÓN GENERAL
              </Box>
              <Typography
                sx={{
                  fontSize: '42px',
                  fontWeight: '800',
                  color: '#1e3a8a',
                  marginBottom: '5px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {(
                  (leadershipPractices.reduce((sum, p) => sum + p.auto_total, 0) +
                    leadershipPractices.reduce((sum, p) => sum + p.otros_total, 0)) /
                    (leadershipPractices.length * 2) || 0
                ).toFixed(1)}
              </Typography>
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#475569',
                  fontWeight: '600',
                }}
              >
                de 6.0 puntos
              </Typography>
            </Box>
          </Grid>

          {/* Categorías Evaluadas */}
          <Grid size={{ xs: 6 }}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
                borderRadius: '12px',
                border: '2px solid #0369a1',
                padding: '25px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                height: '180px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {/* Decoración esquina */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '30px',
                  height: '30px',
                  backgroundColor: '#0369a1',
                  clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                }}
              />

              <Box
                sx={{
                  backgroundColor: '#0369a1',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '15px',
                  display: 'inline-block',
                  letterSpacing: '0.5px',
                  mx: 'auto',
                }}
              >
                PRÁCTICAS EVALUADAS
              </Box>
              <Typography
                sx={{
                  fontSize: '42px',
                  fontWeight: '800',
                  color: '#0369a1',
                  marginBottom: '5px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                {leadershipPractices.length}
              </Typography>
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#475569',
                  fontWeight: '600',
                }}
              >
                áreas analizadas
              </Typography>
            </Box>
          </Grid>
        </Grid>

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

          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: '#1e3a8a',
              fontWeight: '700',
              fontSize: '16px',
              letterSpacing: '0.5px',
            }}
          >
            INFORMACIÓN DEL ANÁLISIS
          </Typography>

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
              maxHeight: '300px',
            }}
          >
            <Table size="small" stickyHeader>
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
                    const difference = practice.auto_total - practice.otros_total;
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
                            color: '#1976d2',
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
                            color: '#d32f2f',
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
                            color: difference > 0 ? '#2e7d32' : difference < 0 ? '#d32f2f' : '#1e3a8a',
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
            <span style={{ color: '#059669', fontWeight: '600' }}>diferencias positivas</span> indican que el líder se percibe con mayor
            competencia, mientras que las <span style={{ color: '#dc2626', fontWeight: '600' }}>diferencias negativas</span> sugieren áreas
            donde los colaboradores ven un desempeño superior al que el líder reconoce en sí mismo.
          </Typography>
        </Box>
      </Paper>

      {/* ==================== PÁGINA 2: ANÁLISIS GRÁFICO ==================== */}
      <Paper sx={pageStyle}>
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
                    index: index + 1,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
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
                    stroke="#1976d2"
                    strokeWidth={4}
                    dot={{ fill: '#1976d2', strokeWidth: 3, r: 6 }}
                    activeDot={{ r: 8, fill: '#1976d2', strokeWidth: 3, stroke: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="OBSERVADORES"
                    stroke="#d32f2f"
                    strokeWidth={4}
                    dot={{ fill: '#d32f2f', strokeWidth: 3, r: 6 }}
                    activeDot={{ r: 8, fill: '#d32f2f', strokeWidth: 3, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}

        {/* Interpretación del análisis con estilo corporativo */}
        <Box
          sx={{
            // background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            borderRadius: '12px',
            border: '2px solid #059669',
            padding: '25px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Elementos decorativos */}
          <Box
            sx={{
              position: 'absolute',
              top: '15px',
              right: '20px',
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: '25px',
                height: '25px',
                backgroundColor: '#059669',
                borderRadius: '50%',
              }}
            />
          </Box>

          <Box
            sx={{
              backgroundColor: '#059669',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '15px',
              display: 'inline-block',
              letterSpacing: '0.5px',
            }}
          >
            INTERPRETACIÓN DEL ANÁLISIS COMPARATIVO
          </Box>

          <Typography
            variant="body2"
            sx={{
              fontSize: '0.9rem',
              lineHeight: 1.6,
              mb: 2,
              color: '#065f46',
              fontWeight: '500',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <strong>El gráfico de líneas</strong> facilita la visualización de las diferencias entre autopercepción y percepción externa en
            cada práctica.
            <span style={{ color: '#1976d2', fontWeight: '700' }}> Las líneas azules (autopercepción)</span> y
            <span style={{ color: '#d32f2f', fontWeight: '700' }}> rojas (observadores)</span> permiten identificar rápidamente:
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
                color: '#065f46',
                fontWeight: '500',
              },
            }}
          >
            <li>
              <strong style={{ color: '#059669' }}>Convergencias:</strong> Donde ambas líneas se aproximan, indicando alineación perceptual
            </li>
            <li>
              <strong style={{ color: '#d97706' }}>Divergencias:</strong> Separaciones significativas que requieren atención y desarrollo
            </li>
            <li>
              <strong style={{ color: '#7c3aed' }}>Patrones:</strong> Tendencias consistentes que revelan fortalezas o áreas de mejora
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
            <Paper key={`${categoryIndex}-graph`} sx={pageStyle}>
              {/* Encabezado Corporativo para Categoría */}
              <Box
                sx={{
                  backgroundColor: '#1e3a8a',
                  color: 'white',
                  padding: '15px 25px',
                  marginBottom: '25px',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '8px',
                }}
              >
                {/* Elementos decorativos geométricos */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '80px',
                    height: '80px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: '-15px',
                    left: '60%',
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    transform: 'rotate(45deg)',
                  }}
                />

                <Typography
                  variant="h4"
                  sx={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center',
                  }}
                >
                  {category.category.name.toUpperCase()}
                </Typography>
                <Box
                  sx={{
                    width: '60px',
                    height: '3px',
                    backgroundColor: '#60a5fa',
                    marginTop: '8px',
                    position: 'relative',
                    zIndex: 1,
                    mx: 'auto',
                  }}
                />
              </Box>

              {/* Descripción de la categoría con estilo corporativo */}
              {practiceInfo && practiceInfo.description && (
                <Box
                  sx={{
                    // background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    borderRadius: '12px',
                    border: '2px solid #3b82f6',
                    padding: '25px',
                    mb: 4,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Icono decorativo */}
                  {/* <Box
                    sx={{
                      position: 'absolute',
                      top: '15px',
                      right: '20px',
                      width: '40px',
                      height: '40px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#3b82f6',
                        borderRadius: '50%',
                      }}
                    />
                  </Box> */}

                  {/* <Box
                    sx={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginBottom: '15px',
                      display: 'inline-block',
                      letterSpacing: '0.5px',
                    }}
                  >
                    DESCRIPCIÓN DE LA PRÁCTICA
                  </Box> */}

                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      whiteSpace: 'break-spaces',
                      color: '#1e40af',
                      fontWeight: '500',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {practiceInfo.description}
                  </Typography>
                </Box>
              )}

              {/* Gráfico comparativo con estilo corporativo */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderRadius: '12px',
                  border: '2px solid #0369a1',
                  padding: '20px',
                  mb: 4,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Línea decorativa superior */}
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

                <Box
                  sx={{
                    backgroundColor: '#0369a1',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '20px',
                    display: 'inline-block',
                    letterSpacing: '0.5px',
                  }}
                >
                  ANÁLISIS COMPARATIVO POR PREGUNTA
                </Box>

                <Box
                  sx={{ height: '300px', position: 'relative', zIndex: 1 }}
                  ref={el => {
                    barChartRefs.current[categoryIndex] = el as HTMLDivElement | null;
                  }}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={category.questions.map(q => ({
                        pregunta: q.question_text.length > 60 ? q.question_text.substring(0, 57) + '...' : q.question_text,
                        AUTO: q.leader_avg,
                        OBSERVADORES: q.collaborator_avg,
                      }))}
                      layout="vertical"
                      margin={{ top: 20, right: 40, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                      <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#475569' }} tickCount={6} />
                      <YAxis type="category" dataKey="pregunta" tick={{ fontSize: 8, width: 160, fill: '#475569' }} width={160} />
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
                      <Bar dataKey="AUTO" fill="#1976d2" name="AUTOPERCEPCIÓN" barSize={20} />
                      <Bar dataKey="OBSERVADORES" fill="#d32f2f" name="OBSERVADORES" barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>

              {/* Interpretación del gráfico con estilo corporativo */}
              <Box
                sx={{
                  // background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)',
                  borderRadius: '12px',
                  border: '2px solid #d97706',
                  padding: '25px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Icono decorativo */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '15px',
                    right: '20px',
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'rgba(217, 119, 6, 0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#d97706',
                      borderRadius: '50%',
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    backgroundColor: '#d97706',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '15px',
                    display: 'inline-block',
                    letterSpacing: '0.5px',
                  }}
                >
                  INTERPRETACIÓN DEL GRÁFICO
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    color: '#92400e',
                    fontWeight: '500',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  Este gráfico muestra la comparación entre la <strong>autopercepción del líder</strong> y la{' '}
                  <strong>percepción de los colaboradores</strong> para cada pregunta específica de la práctica{' '}
                  <span style={{ color: '#d97706', fontWeight: '700' }}>{category.category.name}</span>. Las barras permiten identificar
                  preguntas con mayor o menor alineación perceptual.
                </Typography>
              </Box>
            </Paper>

            {/* PÁGINA B: CUADRO DETALLADO */}
            <Paper key={`${categoryIndex}-table`} sx={pageStyle}>
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
                  maxHeight: '550px',
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
                        }}
                      >
                        DIFERENCIA
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {category.questions.map((question, qIndex) => {
                      const difference = question.leader_avg - question.collaborator_avg;
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
                              color: '#dc2626',
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
                              color: difference > 0 ? '#059669' : difference < 0 ? '#dc2626' : '#6b7280',
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
                  // background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  borderRadius: '12px',
                  border: '2px solid #059669',
                  padding: '25px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Elementos decorativos */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '15px',
                    right: '20px',
                    width: '50px',
                    height: '50px',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: '25px',
                      height: '25px',
                      backgroundColor: '#059669',
                      borderRadius: '50%',
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    backgroundColor: '#059669',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '15px',
                    display: 'inline-block',
                    letterSpacing: '0.5px',
                  }}
                >
                  RESUMEN DE LA PRÁCTICA
                </Box>

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
                        color: '#1976d2',
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
                        color: '#d32f2f',
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
                          category.questions.reduce((sum, q) => sum + (q.leader_avg - q.collaborator_avg), 0) / category.questions.length >
                          0
                            ? '#2e7d32'
                            : '#d32f2f',
                        fontWeight: '700',
                        fontSize: '1.2rem',
                      }}
                    >
                      {category.questions.reduce((sum, q) => sum + (q.leader_avg - q.collaborator_avg), 0) / category.questions.length > 0
                        ? '+'
                        : ''}
                      {(
                        category.questions.reduce((sum, q) => sum + (q.leader_avg - q.collaborator_avg), 0) / category.questions.length
                      ).toFixed(1)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </>
        );
      })}
    </Box>
  );
}
