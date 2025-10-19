// ============================================================================
// COMPONENTE CATEGORY REPORT TAB
// ============================================================================
// Pestaña de análisis por categorías en modo reporte estructurado para exportación
// ============================================================================

import {
  Box,
  Typography,
  Card,
  CardContent,
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
} from '@mui/material';
import { PictureAsPdf as PdfIcon, Description as WordIcon, Print as PrintIcon } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { CategoryData, CategorySummary, ComparativeData } from './types';

interface CategoryReportTabProps {
  categoryData: CategoryData[];
  categorySummary: CategorySummary[];
  comparativeData: ComparativeData[];
  loading: boolean;
  teamName?: string;
}
// Configuración de las 5 prácticas de liderazgo
const LEADERSHIP_PRACTICES = {
  'Modelar el Camino': {
    description:
      'Las palabras y los planes no son suficientes. El Líder tiene que demostrar sus creencias. Hay que practicar lo que se predica.',
    color: '#1976d2',
  },
  'Inspirar una Visión Compartida': {
    description: 'Los líderes tienen puesta la mira en el futuro, visiones ideales de cómo quieren que sean las cosas.',
    color: '#388e3c',
  },
  'Desafiar el Proceso': {
    description:
      'Los líderes buscan y aceptan las oportunidades de probar sus habilidades. Los líderes experimentan, toman riesgos y aprenden de la experiencia.',
    color: '#f57c00',
  },
  'Capacitar a Otros para la Acción': {
    description:
      'Los líderes forman equipos cohesionados, que se sienten como en familia. Los líderes promueven la autoconfianza y el desarrollo de las capacidades.',
    color: '#7b1fa2',
  },
  'Estimular Emotivamente': {
    description:
      'Un líder reconoce las contribuciones demostrando aprecio por la excelencia individual. Celebra las victorias y el valor de los miembros del equipo creando espíritu de comunidad.',
    color: '#c2185b',
  },
} as const;

// Componente personalizado para mostrar etiquetas en los puntos
const CustomLabel = (props: { x?: number; y?: number; value?: number | string; color?: string }) => {
  const { x, y, value, color } = props;
  return (
    <text x={x} y={y ? y - 10 : 0} dy={0} textAnchor="middle" fill={color || '#333'} fontSize="10" fontWeight="bold">
      {value}
    </text>
  );
};

export function CategoryReportTab({
  categoryData,
  categorySummary,
  comparativeData,
  loading,
  teamName = 'Equipo',
}: CategoryReportTabProps) {
  // Estilo común para páginas responsivas
  const pageStyle = {
    p: { xs: 2, md: 4 },
    mb: 4,
    minHeight: { xs: '279mm', md: '279mm' },
    '@media print': {
      minHeight: '279mm',
      pageBreakAfter: 'always',
    },
  };
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography>Cargando datos del reporte...</Typography>
      </Box>
    );
  }
  console.log({ categoryData, categorySummary, comparativeData });

  if (categoryData.length === 0) {
    return <Alert severity="info">No hay datos disponibles para generar el reporte por categorías.</Alert>;
  }

  // Funciones de exportación (placeholder)
  const handleExportToPDF = () => {
    console.log('Exportar a PDF');
    // TODO: Implementar exportación a PDF
  };

  const handleExportToWord = () => {
    console.log('Exportar a Word');
    // TODO: Implementar exportación a Word
  };

  const handlePrint = () => {
    window.print();
  };

  // Calcular totales para el resumen
  const leadershipPractices = categorySummary.filter(cat =>
    Object.keys(LEADERSHIP_PRACTICES).some(
      practice => practice.toLowerCase().includes(cat.category.toLowerCase()) || cat.category.toLowerCase().includes(practice.toLowerCase())
    )
  );

  return (
    <Box
      sx={{
        maxWidth: { xs: '100%', md: '210mm' },
        mx: 'auto',
        p: { xs: 1, md: 3 },
        backgroundColor: 'white',
        minHeight: 'fit-content',
        height: 'auto',
      }}
    >
      {/* Botones de exportación */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center', '@media print': { display: 'none' } }}>
        <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportToPDF} disabled>
          Exportar PDF
        </Button>
        <Button variant="outlined" startIcon={<WordIcon />} onClick={handleExportToWord} disabled>
          Exportar Word
        </Button>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
          Imprimir
        </Button>
      </Box>

      {/* ==================== CARÁTULA ==================== */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          textAlign: 'center',
          minHeight: { xs: '297mm', md: '297mm' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          '@media print': {
            minHeight: '297mm',
            pageBreakAfter: 'always',
          },
        }}
      >
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          REPORTE DE LIDERAZGO
        </Typography>
        <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
          {teamName}
        </Typography>
        <Typography variant="h6" sx={{ mt: 6, color: 'text.secondary' }}>
          Análisis Comparativo de las Cinco Prácticas de Liderazgo
        </Typography>
        <Typography variant="body1" sx={{ mt: 4, color: 'text.secondary' }}>
          {new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Typography>
      </Paper>

      {/* ==================== PÁGINA 1: RESUMEN EJECUTIVO ==================== */}
      <Paper sx={pageStyle}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', mb: 4 }}>
          Resumen de Resultados sobre las Cinco Prácticas de Liderazgo
        </Typography>

        {/* Tabla comparativa principal */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            Cuadro Comparativo - Percepción del Líder vs Colaboradores
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>PRÁCTICA</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                    AUTO
                  </TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                    OBSERVADORES
                  </TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>
                    DIFERENCIA
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leadershipPractices.length > 0 ? (
                  leadershipPractices.map((practice, index) => {
                    const difference = practice.auto_total - practice.otros_total;
                    return (
                      <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'grey.50' } }}>
                        <TableCell sx={{ fontWeight: 'medium' }}>{practice.category}</TableCell>
                        <TableCell align="center" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                          {practice.auto_total.toFixed(1)}
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
                          {practice.otros_total.toFixed(1)}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 'bold',
                            color: difference > 0 ? 'success.main' : difference < 0 ? 'error.main' : 'text.primary',
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
                    <TableCell colSpan={4} align="center">
                      No se encontraron prácticas de liderazgo definidas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Información del equipo */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Información del Equipo
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body1">
                <strong>Equipo:</strong> {teamName}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body1">
                <strong>Período:</strong> {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body1">
                <strong>Total de Evaluaciones:</strong> {comparativeData.length}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body1">
                <strong>Categorías Analizadas:</strong> {categoryData.length}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* ==================== PÁGINA 2: RESUMEN GRÁFICO ==================== */}
      <Paper sx={pageStyle}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', mb: 4 }}>
          Resumen Gráfico - Prácticas de Liderazgo
        </Typography>

        {leadershipPractices.length > 0 && (
          <Box sx={{ height: 450, mb: 4 }}>
            <ResponsiveContainer width="100%" height={450}>
              <LineChart
                data={leadershipPractices.map((practice, index) => ({
                  practica: practice.category,
                  AUTO: Number(practice.auto_total.toFixed(1)),
                  OBSERVADORES: Number(practice.otros_total.toFixed(1)),
                  index: index + 1,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="practica"
                  tick={{ fontSize: 10, textAnchor: 'end' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis domain={[15, 30]} tick={{ fontSize: 10 }} tickCount={8} />
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  labelFormatter={label => label}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '50px' }} />
                <Line
                  type="monotone"
                  dataKey="AUTO"
                  stroke="#1976d2"
                  strokeWidth={2}
                  dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#1976d2', strokeWidth: 2 }}
                  label={<CustomLabel color="#1976d2" />}
                />
                <Line
                  type="monotone"
                  dataKey="OBSERVADORES"
                  stroke="#d32f2f"
                  strokeWidth={2}
                  dot={{ fill: '#d32f2f', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#d32f2f', strokeWidth: 2 }}
                  label={<CustomLabel color="#d32f2f" />}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Interpretación del Gráfico
        </Typography>
        <Typography variant="body1" paragraph>
          El gráfico anterior muestra la comparación entre la autopercepción del líder (AUTO) y la percepción de los colaboradores
          (OBSERVADORES) en cada una de las cinco prácticas de liderazgo.
        </Typography>
        <Typography variant="body1" paragraph>
          Las diferencias significativas entre ambas percepciones indican áreas de oportunidad para el desarrollo del liderazgo y la
          comunicación en el equipo.
        </Typography>
      </Paper>

      {/* ==================== PÁGINAS SIGUIENTES: DETALLE POR CATEGORÍA ==================== */}
      {categoryData.map((category, categoryIndex) => {
        const practiceInfo = Object.entries(LEADERSHIP_PRACTICES).find(
          ([practice]) =>
            practice.toLowerCase().includes(category.category.toLowerCase()) ||
            category.category.toLowerCase().includes(practice.toLowerCase())
        );

        return (
          <Paper key={categoryIndex} sx={pageStyle}>
            <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', mb: 4 }}>
              Resumen de Resultados - {category.category}
            </Typography>

            {/* Descripción de la categoría */}
            {practiceInfo && (
              <Card sx={{ mb: 4, backgroundColor: 'primary.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Descripción de la Práctica
                  </Typography>
                  <Typography variant="body1">{practiceInfo[1].description}</Typography>
                </CardContent>
              </Card>
            )}

            {/* Gráfico comparativo de la categoría */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Análisis Comparativo por Pregunta
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={category.questions.map(q => ({
                      pregunta: q.question_text.length > 80 ? q.question_text.substring(0, 80) + '...' : q.question_text,
                      AUTO: q.leader_avg,
                      OBSERVADORES: q.collaborator_avg,
                    }))}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} tickCount={7} />
                    <YAxis type="category" dataKey="pregunta" tick={{ fontSize: 9, width: 180 }} width={180} />
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="AUTO" fill="#1976d2" name="AUTO" barSize={15} />
                    <Bar dataKey="OBSERVADORES" fill="#d32f2f" name="OBSERVADORES" barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            {/* Tabla detallada de preguntas */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Detalle de Preguntas
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>No.</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Pregunta</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        AUTO
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        OBSERVADORES
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        DIFERENCIA
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {category.questions.map((question, qIndex) => {
                      const difference = question.leader_avg - question.collaborator_avg;
                      return (
                        <TableRow key={qIndex}>
                          <TableCell>{question.question_number}</TableCell>
                          <TableCell sx={{ maxWidth: 300 }}>{question.question_text}</TableCell>
                          <TableCell align="center" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                            {question.leader_avg.toFixed(1)}
                          </TableCell>
                          <TableCell align="center" sx={{ color: 'secondary.main', fontWeight: 'bold' }}>
                            {question.collaborator_avg.toFixed(1)}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              fontWeight: 'bold',
                              color: difference > 0 ? 'success.main' : difference < 0 ? 'error.main' : 'text.primary',
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
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}
