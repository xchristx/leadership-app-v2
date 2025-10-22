import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CardMedia } from '@mui/material';

interface PDFPreviewPageProps {
  pageType: 'cover' | 'summary' | 'chart' | 'categoryChart' | 'categoryTable';
  data: any;
  categoryIndex?: number;
}

export const PDFPreviewPage: React.FC<PDFPreviewPageProps> = ({ pageType, data, categoryIndex = 0 }) => {
  // Estilos CSS que simulan el PDF (editables)
  const pageStyles = {
    // Página base
    page: {
      width: '210mm',
      minHeight: '297mm',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      margin: '20px auto',
      position: 'relative' as const,
      fontFamily: 'Roboto, Arial, sans-serif',
    },

    // Carátula
    coverPage: {
      width: '210mm',
      height: '297mm',
      backgroundColor: '#fafafa',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      margin: '20px auto',
      position: 'relative' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      fontFamily: 'Roboto, Arial, sans-serif',
    },

    coverHeader: {
      height: '80px',
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%)',
      position: 'relative' as const,
    },

    coverMainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      padding: '60px 40px',
    },

    coverTitleBox: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: '25px',
      marginBottom: '30px',
      width: '80%',
      maxWidth: '400px',
      textAlign: 'center' as const,
      border: '1px solid #e0e0e0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },

    coverTeamBox: {
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      padding: '25px',
      marginBottom: '20px',
      width: '75%',
      maxWidth: '380px',
      textAlign: 'center' as const,
      border: '2px solid #e3f2fd',
    },

    coverFooter: {
      backgroundColor: '#ffffff',
      borderTop: '3px solid #1976d2',
      padding: '15px 20px',
    },

    coverFooterContent: {
      backgroundColor: '#f8f9fa',
      borderRadius: '6px',
      padding: '15px',
      border: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Página con márgenes
    pageWithMargins: {
      width: '210mm',
      minHeight: '297mm',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      margin: '20px auto',
      padding: '20mm',
      position: 'relative' as const,
      fontFamily: 'Roboto, Arial, sans-serif',
      boxSizing: 'border-box' as const,
    },

    // Títulos y textos
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#1976d2',
      marginBottom: '15px',
      marginTop: '10px',
      textAlign: 'center' as const,
      textTransform: 'uppercase' as const,
    },

    heading3: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#374151',
      marginBottom: '10px',
      marginTop: '8px',
    },

    paragraph: {
      fontSize: '10px',
      lineHeight: 1.5,
      marginBottom: '8px',
      color: '#374151',
      textAlign: 'justify' as const,
    },

    // Cajas de interpretación
    interpretationBox: {
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderLeft: '4px solid #3b82f6',
      borderRadius: '6px',
      padding: '15px',
      marginTop: '20px',
      marginBottom: '10px',
    },

    // Tabla
    tableContainer: {
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      marginBottom: '15px',
      overflow: 'hidden',
    },

    tableHeader: {
      backgroundColor: '#f9fafb',
      fontWeight: 700,
      fontSize: '9px',
      color: '#374151',
    },

    tableCell: {
      padding: '8px',
      fontSize: '9px',
      borderRight: '1px solid #e5e7eb',
    },

    // Placeholder para gráficos
    chartPlaceholder: {
      width: '100%',
      height: '200px',
      backgroundColor: '#f0f0f0',
      border: '2px dashed #ccc',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '15px',
    },

    // Elementos decorativos
    decorativeElements: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '20px',
    },

    decorativeDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#e3f2fd',
      margin: '0 4px',
    },

    decorativeDotActive: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: '#1976d2',
      margin: '0 4px',
    },
  };

  const renderCoverPage = () => (
    <Box style={pageStyles.coverPage}>
      {/* Header corporativo */}
      <Box style={pageStyles.coverHeader}>
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
      </Box>

      {/* Contenido principal */}
      <Box style={pageStyles.coverMainContent}>
        {/* Caja del título principal */}
        <Box
          sx={{
            mb: 6,
            p: 4,
            backgroundColor: '#f8f9fa',
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
              width: '100%',
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
              color: '#1976d2',
              mb: 1,
              fontSize: { xs: '2rem', md: '2.5rem' },
              letterSpacing: '1px',
              textTransform: 'uppercase',
              lineHeight: 1.1,
              textAlign: 'center',
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
              textAlign: 'center',
            }}
          >
            PRÁCTICAS DE LIDERAZGO
          </Typography>
        </Box>

        {/* Información del equipo */}
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
            {data.teamName}
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

        {/* Elementos decorativos */}
        <Box style={pageStyles.decorativeElements}>
          <Box style={pageStyles.decorativeDot}></Box>
          <Box style={pageStyles.decorativeDot}></Box>
          <Box style={pageStyles.decorativeDotActive}></Box>
          <Box style={pageStyles.decorativeDot}></Box>
          <Box style={pageStyles.decorativeDot}></Box>
        </Box>
      </Box>

      {/* Footer corporativo */}
      <Box style={pageStyles.coverFooter}>
        <Box style={pageStyles.coverFooterContent}>
          <Box style={{ textAlign: 'center' }}>
            <Typography
              style={{
                fontSize: '8px',
                color: '#546e7a',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '2px',
              }}
            >
              Fecha de Elaboración
            </Typography>
            <Typography style={{ fontSize: '11px', color: '#1976d2', fontWeight: 600 }}>
              {new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderSummaryPage = () => (
    <Box style={pageStyles.pageWithMargins}>
      <Typography style={pageStyles.sectionTitle}>RESUMEN EJECUTIVO</Typography>

      <Typography style={{ ...pageStyles.heading3, textAlign: 'center', marginBottom: '20px' }}>
        Cinco Prácticas de Liderazgo - Análisis Comparativo
      </Typography>

      {/* Información del equipo */}
      <Box style={{ backgroundColor: '#f1f5f9', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '20px', marginBottom: '20px' }}>
        <Box
          style={{
            borderTop: '4px solid #1e3a8a',
            borderRadius: '8px 8px 0 0',
            marginTop: '-20px',
            marginLeft: '-20px',
            marginRight: '-20px',
            height: '4px',
          }}
        ></Box>
        <Box style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
          <Box>
            <Typography style={{ fontSize: '9px', marginBottom: '4px' }}>
              <strong style={{ color: '#1e3a8a' }}>Equipo:</strong> {data.teamName}
            </Typography>
            <Typography style={{ fontSize: '9px' }}>
              <strong style={{ color: '#1e3a8a' }}>Período:</strong>{' '}
              {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </Typography>
          </Box>
          <Box>
            <Typography style={{ fontSize: '9px', marginBottom: '4px' }}>
              <strong style={{ color: '#1e3a8a' }}>Total preguntas:</strong> {data.comparativeDataLength}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tabla comparativa */}
      <Typography style={{ ...pageStyles.heading3, textAlign: 'center', marginBottom: '10px' }}>
        Cuadro Comparativo - Autopercepción vs Percepción de Colaboradores
      </Typography>

      <TableContainer component={Paper} style={pageStyles.tableContainer}>
        <Table size="small">
          <TableHead>
            <TableRow style={{ backgroundColor: '#f9fafb' }}>
              <TableCell style={{ ...pageStyles.tableHeader, ...pageStyles.tableCell }}>Práctica de Liderazgo</TableCell>
              <TableCell style={{ ...pageStyles.tableHeader, ...pageStyles.tableCell, textAlign: 'center' }}>Autopercepción</TableCell>
              <TableCell style={{ ...pageStyles.tableHeader, ...pageStyles.tableCell, textAlign: 'center' }}>Observadores</TableCell>
              <TableCell style={{ ...pageStyles.tableHeader, ...pageStyles.tableCell, textAlign: 'center' }}>Diferencia</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.categorySummary.map((practice: any, index: number) => {
              const difference = practice.auto_total - practice.otros_total;
              return (
                <TableRow key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                  <TableCell style={{ ...pageStyles.tableCell, fontWeight: 600, color: '#1976d2' }}>{practice.category}</TableCell>
                  <TableCell style={{ ...pageStyles.tableCell, textAlign: 'center', color: '#1976d2', fontWeight: 700 }}>
                    {practice.auto_total.toFixed(1)}
                  </TableCell>
                  <TableCell style={{ ...pageStyles.tableCell, textAlign: 'center', color: '#d32f2f', fontWeight: 700 }}>
                    {practice.otros_total.toFixed(1)}
                  </TableCell>
                  <TableCell
                    style={{
                      ...pageStyles.tableCell,
                      textAlign: 'center',
                      fontWeight: 700,
                      color: difference > 0 ? '#2e7d32' : difference < 0 ? '#d32f2f' : '#1e3a8a',
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

      {/* Interpretación */}
      <Box style={pageStyles.interpretationBox}>
        <Typography style={pageStyles.heading3}>Interpretación</Typography>
        <Typography style={pageStyles.paragraph}>
          Este cuadro presenta la comparación entre la <strong>autopercepción del líder</strong> y la{' '}
          <strong>percepción de sus colaboradores</strong> en las cinco prácticas fundamentales del liderazgo. Las{' '}
          <span style={{ color: '#059669', fontWeight: 600 }}>diferencias positivas</span> indican que el líder se percibe con mayor
          competencia, mientras que las <span style={{ color: '#dc2626', fontWeight: 600 }}>diferencias negativas</span> sugieren áreas
          donde los colaboradores ven un desempeño superior al que el líder reconoce en sí mismo.
        </Typography>
      </Box>
    </Box>
  );

  const renderChartPage = () => (
    <Box style={pageStyles.pageWithMargins}>
      <Typography style={pageStyles.sectionTitle}>ANÁLISIS GRÁFICO COMPARATIVO</Typography>

      {/* Placeholder para gráfico */}
      <Box style={pageStyles.chartPlaceholder}>
        <Typography style={{ color: '#666', fontSize: '14px' }}>📊 Gráfico de Líneas Comparativo</Typography>
      </Box>

      {/* Interpretación */}
      <Box style={pageStyles.interpretationBox}>
        <Typography style={pageStyles.heading3}>Interpretación del Análisis</Typography>
        <Typography style={pageStyles.paragraph}>
          <strong>El gráfico de líneas</strong> facilita la visualización de las diferencias entre autopercepción y percepción externa en
          cada práctica. Las <span style={{ color: '#1976d2', fontWeight: 600 }}>líneas azules (autopercepción)</span> y{' '}
          <span style={{ color: '#d32f2f', fontWeight: 600 }}>rojas (observadores)</span> permiten identificar rápidamente:
        </Typography>

        <ul style={{ fontSize: '9px', lineHeight: 1.5, marginBottom: '8px', color: '#6b7280', paddingLeft: '20px' }}>
          <li>
            <strong style={{ color: '#059669' }}>Convergencias:</strong> Donde ambas líneas se aproximan, indicando alineación perceptual
          </li>
          <li>
            <strong style={{ color: '#d97706' }}>Divergencias:</strong> Separaciones significativas que requieren atención y desarrollo
          </li>
          <li>
            <strong style={{ color: '#7c3aed' }}>Patrones:</strong> Tendencias consistentes que revelan fortalezas o áreas de mejora
          </li>
        </ul>
      </Box>
    </Box>
  );

  const renderCategoryChartPage = () => {
    const category = data.categoryData[categoryIndex];

    return (
      <Box style={pageStyles.pageWithMargins}>
        <Typography style={pageStyles.sectionTitle}>{category.category.name}</Typography>

        {/* Descripción de la práctica */}
        <Box style={pageStyles.interpretationBox}>
          <Typography style={pageStyles.heading3}>Descripción de la Práctica</Typography>
          <Typography style={pageStyles.paragraph}>
            {category.category.description || 'Descripción de la práctica de liderazgo y su importancia en el desarrollo organizacional.'}
          </Typography>
        </Box>

        {/* Título del análisis */}
        <Typography style={{ ...pageStyles.heading3, textAlign: 'center', marginBottom: '10px' }}>
          Análisis Comparativo por Pregunta
        </Typography>

        {/* Placeholder para gráfico de barras */}
        <Box style={pageStyles.chartPlaceholder}>
          <Typography style={{ color: '#666', fontSize: '14px' }}>📊 Gráfico de Barras - {category.category.name}</Typography>
        </Box>

        {/* Interpretación */}
        <Box style={pageStyles.interpretationBox}>
          <Typography style={pageStyles.heading3}>Interpretación del Análisis</Typography>
          <Typography style={pageStyles.paragraph}>
            Este gráfico muestra la comparación entre la <strong>autopercepción del líder</strong> y la{' '}
            <strong>percepción de los colaboradores</strong> para cada pregunta específica de la práctica{' '}
            <span style={{ color: '#059669', fontWeight: 600 }}>{category.category.name}</span>. Las barras permiten identificar preguntas
            con mayor o menor alineación perceptual.
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderCategoryTablePage = () => {
    const category = data.categoryData[categoryIndex];

    return (
      <Box style={pageStyles.pageWithMargins}>
        <Typography style={{ ...pageStyles.sectionTitle, fontSize: '14px' }}>Detalle por Pregunta - {category.category.name}</Typography>

        {/* Tabla detallada */}
        <TableContainer component={Paper} style={pageStyles.tableContainer}>
          <Table size="small">
            <TableHead>
              <TableRow style={{ backgroundColor: '#0369a1' }}>
                <TableCell style={{ ...pageStyles.tableHeader, ...pageStyles.tableCell, color: 'white', width: '8%' }}>No.</TableCell>
                <TableCell style={{ ...pageStyles.tableHeader, ...pageStyles.tableCell, color: 'white', width: '52%' }}>PREGUNTA</TableCell>
                <TableCell
                  style={{ ...pageStyles.tableHeader, ...pageStyles.tableCell, color: 'white', width: '15%', textAlign: 'center' }}
                >
                  AUTOPERCEPCIÓN
                </TableCell>
                <TableCell
                  style={{ ...pageStyles.tableHeader, ...pageStyles.tableCell, color: 'white', width: '15%', textAlign: 'center' }}
                >
                  OBSERVADORES
                </TableCell>
                <TableCell
                  style={{ ...pageStyles.tableHeader, ...pageStyles.tableCell, color: 'white', width: '10%', textAlign: 'center' }}
                >
                  DIFERENCIA
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {category.questions.map((question: any, qIndex: number) => {
                const difference = question.leader_avg - question.collaborator_avg;
                return (
                  <TableRow key={qIndex} style={{ backgroundColor: qIndex % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                    <TableCell style={{ ...pageStyles.tableCell, textAlign: 'center' }}>{question.question_number}</TableCell>
                    <TableCell style={pageStyles.tableCell}>{question.question_text}</TableCell>
                    <TableCell style={{ ...pageStyles.tableCell, textAlign: 'center', color: '#1976d2', fontWeight: 700 }}>
                      {question.leader_avg.toFixed(1)}
                    </TableCell>
                    <TableCell style={{ ...pageStyles.tableCell, textAlign: 'center', color: '#d32f2f', fontWeight: 700 }}>
                      {question.collaborator_avg.toFixed(1)}
                    </TableCell>
                    <TableCell
                      style={{
                        ...pageStyles.tableCell,
                        textAlign: 'center',
                        fontWeight: 700,
                        color: difference > 0 ? '#2e7d32' : difference < 0 ? '#d32f2f' : '#1e3a8a',
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

        {/* Resumen de la categoría */}
        <Box style={pageStyles.interpretationBox}>
          <Typography style={pageStyles.heading3}>Resumen de la Práctica</Typography>

          <Box style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Typography style={pageStyles.paragraph}>
              <strong>Promedio Autopercepción:</strong>{' '}
              {(category.questions.reduce((sum: number, q: any) => sum + q.leader_avg, 0) / category.questions.length).toFixed(1)}
            </Typography>
            <Typography style={pageStyles.paragraph}>
              <strong>Promedio Observadores:</strong>{' '}
              {(category.questions.reduce((sum: number, q: any) => sum + q.collaborator_avg, 0) / category.questions.length).toFixed(1)}
            </Typography>
          </Box>

          <Typography style={pageStyles.paragraph}>
            <strong>Diferencia Promedio:</strong>{' '}
            {(
              category.questions.reduce((sum: number, q: any) => sum + (q.leader_avg - q.collaborator_avg), 0) / category.questions.length
            ).toFixed(1)}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Renderizar según el tipo de página
  switch (pageType) {
    case 'cover':
      return renderCoverPage();
    case 'summary':
      return renderSummaryPage();
    case 'chart':
      return renderChartPage();
    case 'categoryChart':
      return renderCategoryChartPage();
    case 'categoryTable':
      return renderCategoryTablePage();
    default:
      return <Box>Tipo de página no reconocido</Box>;
  }
};
