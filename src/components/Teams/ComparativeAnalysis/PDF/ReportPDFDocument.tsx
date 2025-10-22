import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import logo from './ho_logo.jpg';

// Registrar fuentes personalizadas si es necesario
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
  ],
});

// Definir tipos para las props
export interface CategoryQuestion {
  question_number: number;
  question_text: string;
  leader_avg: number;
  collaborator_avg: number;
}

export interface CategoryReportData {
  category: {
    name: string;
  };
  questions: CategoryQuestion[];
}

export interface LeadershipPractice {
  id: string;
  name: string;
  description: string;
  color: string;
  order_index: number;
}

export interface CategorySummary {
  category: string;
  auto_total: number;
  otros_total: number;
}

export interface ReportPDFProps {
  teamName: string;
  categoryData: CategoryReportData[];
  categorySummary: CategorySummary[];
  leadershipPractices: LeadershipPractice[];
  chartImages: {
    lineChart: string | null;
    barCharts: (string | null)[];
  };
  comparativeDataLength: number;
}

// Estilos del PDF
const styles = StyleSheet.create({
  // Configuración de página
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    paddingVertical: '25mm', // Márgenes estándar de documento (aproximadamente 2cm)
    paddingHorizontal: '30mm',
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.4,
  },

  // Página específica para carátula (sin márgenes para diseño completo)
  coverPage: {
    flexDirection: 'column',
    backgroundColor: '#fafafa',
    padding: 0,
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.4,
  },

  // Estilos de encabezados
  title: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: 'center',
    color: '#1976d2',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  subtitle: {
    fontSize: 16,
    fontWeight: 600,
    textAlign: 'center',
    color: '#0d47a1',
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1976d2',
    marginBottom: 15,
    marginTop: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  heading3: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 10,
    marginTop: 8,
  },

  // Estilos de contenido
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 8,
    color: '#374151',
    textAlign: 'justify',
  },

  boldText: {
    fontWeight: 700,
    color: '#1976d2',
  },

  // Contenedores y cajas mejorados
  infoBox: {
    backgroundColor: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: 12,
    borderTop: '4px solid #1976d2',
    padding: 18,
    marginBottom: 24,
  },

  interpretationBox: {
    backgroundColor: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderLeft: '6px solid #3b82f6',
    borderRadius: 10,
    padding: 18,
    marginTop: 24,
    marginBottom: 16,
  },

  // Caja de alerta/destacado
  highlightBox: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderLeft: '6px solid #ff8f00',
    borderRadius: 10,
    padding: 16,
    marginVertical: 12,
  },

  // Caja de éxito
  successBox: {
    backgroundColor: '#d4edda',
    border: '2px solid #28a745',
    borderLeft: '6px solid #155724',
    borderRadius: 10,
    padding: 16,
    marginVertical: 12,
  },

  // Estilos de tabla
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 15,
  },

  tableRow: {
    flexDirection: 'row',
  },

  tableHeader: {
    backgroundColor: '#f9fafb',
    fontWeight: 700,
    fontSize: 9,
    color: '#374151',
  },

  tableCell: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
    fontSize: 9,
    textAlign: 'left',
  },

  tableCellCenter: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
    fontSize: 9,
    textAlign: 'center',
  },

  // Ancho de columnas
  col1: { width: '8%' },
  col2: { width: '52%' },
  col3: { width: '15%' },
  col4: { width: '15%' },
  col5: { width: '10%' },

  // Ancho para tabla resumen
  colSummary1: { width: '40%' },
  colSummary2: { width: '20%' },
  colSummary3: { width: '20%' },
  colSummary4: { width: '20%' },

  // Estilos de imagen
  chartImage: {
    width: '100%',
    height: 200,
    marginBottom: 15,
    objectFit: 'contain',
  },

  chartImageSmall: {
    width: '100%',
    height: 150,
    marginBottom: 10,
    objectFit: 'contain',
  },

  // Estilos de texto especial
  teamName: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 8,
  },

  date: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Estilos para lista
  listItem: {
    fontSize: 9,
    marginBottom: 4,
    paddingLeft: 10,
    color: '#6b7280',
  },

  // Estilos para datos específicos
  positiveValue: {
    color: '#059669',
    fontWeight: 700,
  },

  negativeValue: {
    color: '#dc2626',
    fontWeight: 700,
  },

  neutralValue: {
    color: '#374151',
    fontWeight: 600,
  },

  // Contenedor flex
  flexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  flexColumn: {
    flexDirection: 'column',
    flex: 1,
  },

  // Separador
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 15,
  },

  // Contenedor para carátula
  coverContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
  },

  // Header corporativo con diseño mejorado
  coverHeader: {
    height: 100,
    backgroundColor: '#1976d2',
    position: 'relative',
    borderBottom: '4px solid #0d47a1', // Borde inferior para profundidad
  },

  // Contenido principal de carátula
  coverMainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },

  // Caja del título principal - versión PDF compatible
  coverTitleBox: {
    marginBottom: 48,
    padding: 32,
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    border: '2px solid #e0e0e0',
    borderLeft: '8px solid #1976d2', // Simula gradiente con borde izquierdo
    borderTop: '3px solid #42a5f5', // Borde superior para más profundidad
    maxWidth: '500px',
  },

  // Caja de información del equipo - versión PDF compatible
  coverTeamBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    maxWidth: '480px',
    width: '100%',
    border: '2px solid #e3f2fd',
    borderLeft: '6px solid #1976d2', // Borde decorativo
    borderBottom: '3px solid #42a5f5', // Borde inferior para profundidad
  },

  // Footer corporativo mejorado
  coverFooter: {
    backgroundColor: '#fafafa',
    borderTopWidth: 6,
    borderTopColor: '#1976d2',
    borderTopStyle: 'solid',
    paddingVertical: 20,
    paddingHorizontal: 30,
    position: 'relative',
  },

  coverFooterContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    border: '2px solid #e3f2fd',
    borderLeft: '6px solid #1976d2',
    borderBottom: '3px solid #42a5f5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Barra decorativa superior del footer
  footerTopBar: {
    height: 4,
    backgroundColor: '#42a5f5',
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
  },

  coverTitle: {
    fontWeight: 700,
    color: '#1976d2',
    mb: 1,
    fontSize: '2.5rem',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    lineHeight: 1.1,
    textAlign: 'center',
  },

  coverTitleSecond: {
    fontWeight: 700,
    color: '#0d47a1',
    fontSize: '2.5rem',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    lineHeight: 1.1,
    textAlign: 'center',
  },

  coverTeamName: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 10,
  },

  coverSubtitle: {
    fontSize: 11,
    color: '#546e7a',
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: 1.4,
  },

  coverDate: {
    fontSize: 11,
    color: '#1976d2',
    textAlign: 'center',
    fontWeight: 600,
  },

  // Elementos decorativos mejorados
  decorativeElements: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },

  decorativeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e3f2fd',
    marginHorizontal: 6,
    border: '1px solid #bbdefb',
  },

  decorativeDotActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1976d2',
    marginHorizontal: 6,
    border: '2px solid #0d47a1',
  },

  // Líneas decorativas
  decorativeLine: {
    height: 2,
    backgroundColor: '#e3f2fd',
    marginHorizontal: 20,
    flex: 1,
  },

  decorativeLineActive: {
    height: 3,
    backgroundColor: '#1976d2',
    marginHorizontal: 10,
    flex: 0.5,
  },

  coverFooterLabel: {
    fontSize: 8,
    color: '#546e7a',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
});

export const ReportPDFDocument: React.FC<ReportPDFProps> = ({
  teamName,
  categoryData,
  categorySummary,
  leadershipPractices,
  chartImages,
  comparativeDataLength,
}) => {
  // Filtrar prácticas de liderazgo que coincidan con las categorías
  const filteredLeadershipPractices = categorySummary.filter(cat =>
    leadershipPractices.some(
      practice =>
        practice.name.toLowerCase().includes(cat.category.toLowerCase()) || cat.category.toLowerCase().includes(practice.name.toLowerCase())
    )
  );

  return (
    <Document>
      {/* ==================== CARÁTULA ==================== */}
      <Page size="LETTER" style={styles.coverPage}>
        <View style={styles.coverContainer}>
          {/* Header corporativo mejorado */}
          <View style={styles.coverHeader}>
            {/* Barra decorativa superior */}
            <View style={styles.footerTopBar}></View>

            <View style={{ position: 'absolute', top: 20, left: 4, right: 4, zIndex: 2 }}>
              <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
                <View
                  style={{
                    width: 140,
                    height: 70,
                    backgroundColor: 'white',
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid #e3f2fd',
                    borderBottom: '5px solid #1976d2',
                    borderRight: '2px solid #42a5f5',
                  }}
                >
                  <Image src={logo} style={{ width: 110, height: 'auto', maxHeight: 55 }} />
                </View>
              </View>
            </View>
          </View>

          {/* Contenido principal */}
          <View style={styles.coverMainContent}>
            {/* Caja del título principal mejorada */}
            <View style={styles.coverTitleBox}>
              <Text style={styles.coverTitle}>INVENTARIO DE</Text>
              <Text style={styles.coverTitleSecond}>PRÁCTICAS DE LIDERAZGO</Text>
            </View>

            {/* Información del equipo */}
            <View style={styles.coverTeamBox}>
              <Text style={styles.coverTeamName}>{teamName}</Text>
              <Text style={styles.coverSubtitle}>Análisis Comparativo de las Cinco Prácticas de Liderazgo</Text>
            </View>

            {/* Elementos decorativos mejorados */}
            <View style={styles.decorativeElements}>
              <View style={styles.decorativeLine}></View>
              <View style={styles.decorativeDot}></View>
              <View style={styles.decorativeDotActive}></View>
              <View style={styles.decorativeDot}></View>
              <View style={styles.decorativeLine}></View>
            </View>
          </View>

          {/* Footer corporativo mejorado */}
          <View style={styles.coverFooter}>
            {/* Barra decorativa superior del footer */}
            <View style={styles.footerTopBar}></View>

            <View style={styles.coverFooterContent}>
              <View>
                <Text style={styles.coverFooterLabel}>Fecha de Elaboración</Text>
                <Text style={styles.coverDate}>
                  {new Date().toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* ==================== RESUMEN EJECUTIVO ==================== */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>

        <Text style={styles.subtitle}>Cinco Prácticas de Liderazgo - Análisis Comparativo</Text>

        {/* Información del equipo */}
        <View style={styles.infoBox}>
          <View style={styles.flexRow}>
            <View style={styles.flexColumn}>
              <Text style={styles.paragraph}>
                <Text style={styles.boldText}>Equipo:</Text> {teamName}
              </Text>
              <Text style={styles.paragraph}>
                <Text style={styles.boldText}>Período:</Text> {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.flexColumn}>
              <Text style={styles.paragraph}>
                <Text style={styles.boldText}>Total preguntas:</Text> {comparativeDataLength}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabla comparativa principal */}
        <Text style={styles.heading3}>Cuadro Comparativo - Autopercepción vs Percepción de Colaboradores</Text>

        <View style={styles.table}>
          {/* Encabezado */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.colSummary1]}>Práctica de Liderazgo</Text>
            <Text style={[styles.tableCellCenter, styles.colSummary2]}>Autopercepción</Text>
            <Text style={[styles.tableCellCenter, styles.colSummary3]}>Observadores</Text>
            <Text style={[styles.tableCellCenter, styles.colSummary4]}>Diferencia</Text>
          </View>

          {/* Datos */}
          {filteredLeadershipPractices.length > 0 ? (
            filteredLeadershipPractices.map((practice, index) => {
              const difference = practice.auto_total - practice.otros_total;
              const differenceStyle = difference > 0 ? styles.positiveValue : difference < 0 ? styles.negativeValue : styles.neutralValue;

              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colSummary1, { fontWeight: 600, color: '#1976d2' }]}>{practice.category}</Text>
                  <Text style={[styles.tableCellCenter, styles.colSummary2, { color: '#1976d2', fontWeight: 700 }]}>
                    {practice.auto_total.toFixed(1)}
                  </Text>
                  <Text style={[styles.tableCellCenter, styles.colSummary3, { color: '#d32f2f', fontWeight: 700 }]}>
                    {practice.otros_total.toFixed(1)}
                  </Text>
                  <Text style={[styles.tableCellCenter, styles.colSummary4, differenceStyle]}>
                    {difference > 0 ? '+' : ''}
                    {difference.toFixed(1)}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellCenter, { width: '100%' }]}>No se encontraron prácticas de liderazgo definidas</Text>
            </View>
          )}
        </View>

        {/* Interpretación */}
        <View style={styles.interpretationBox}>
          <Text style={styles.heading3}>Interpretación</Text>
          <Text style={styles.paragraph}>
            Este cuadro presenta la comparación entre la <Text style={styles.boldText}>autopercepción del líder</Text> y la{' '}
            <Text style={styles.boldText}>percepción de sus colaboradores</Text> en las cinco prácticas fundamentales del liderazgo. Las{' '}
            <Text style={styles.positiveValue}>diferencias positivas</Text> indican que el líder se percibe con mayor competencia, mientras
            que las <Text style={styles.negativeValue}>diferencias negativas</Text> sugieren áreas donde los colaboradores ven un desempeño
            superior al que el líder reconoce en sí mismo.
          </Text>
        </View>
      </Page>

      {/* ==================== ANÁLISIS GRÁFICO ==================== */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Análisis Gráfico Comparativo</Text>

        {/* Gráfico principal */}
        {chartImages.lineChart && <Image style={styles.chartImage} src={chartImages.lineChart} />}

        {/* Interpretación del análisis gráfico */}
        <View style={styles.interpretationBox}>
          <Text style={styles.heading3}>Interpretación del Análisis</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.boldText}>El gráfico de líneas</Text> facilita la visualización de las diferencias entre autopercepción y
            percepción externa en cada práctica. Las líneas{' '}
            <Text style={{ color: '#1976d2', fontWeight: 700 }}>azules (autopercepción)</Text> y{' '}
            <Text style={{ color: '#d32f2f', fontWeight: 700 }}>rojas (observadores)</Text> permiten identificar rápidamente:
          </Text>

          <Text style={styles.listItem}>
            • <Text style={styles.positiveValue}>Convergencias:</Text> Donde ambas líneas se aproximan, indicando alineación perceptual
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.negativeValue}>Divergencias:</Text> Separaciones significativas que requieren atención y desarrollo
          </Text>
          <Text style={styles.listItem}>
            • <Text style={{ color: '#7c3aed', fontWeight: 600 }}>Patrones:</Text> Tendencias consistentes que revelan fortalezas o áreas de
            mejora
          </Text>
        </View>
      </Page>

      {/* ==================== DETALLE POR CATEGORÍA ==================== */}
      {categoryData.map((category, categoryIndex) => {
        const practiceInfo = leadershipPractices.find(
          practice =>
            practice.name.toLowerCase().includes(category.category.name.toLowerCase()) ||
            category.category.name.toLowerCase().includes(practice.name.toLowerCase())
        );

        return (
          <React.Fragment key={categoryIndex}>
            {/* PÁGINA A: TÍTULO, DESCRIPCIÓN Y GRÁFICO */}
            <Page size="LETTER" style={styles.page}>
              <Text style={styles.sectionTitle}>{category.category.name}</Text>

              {/* Descripción de la práctica */}
              {practiceInfo?.description && (
                <View style={styles.interpretationBox}>
                  <Text style={styles.heading3}>Descripción de la Práctica</Text>
                  <Text style={styles.paragraph}>{practiceInfo.description}</Text>
                </View>
              )}

              {/* Título del análisis */}
              <Text style={styles.heading3}>Análisis Comparativo por Pregunta</Text>

              {/* Gráfico de barras */}
              {chartImages.barCharts[categoryIndex] && <Image style={styles.chartImageSmall} src={chartImages.barCharts[categoryIndex]} />}

              {/* Interpretación del gráfico */}
              <View style={styles.interpretationBox}>
                <Text style={styles.heading3}>Interpretación del Análisis</Text>
                <Text style={styles.paragraph}>
                  Este gráfico muestra la comparación entre la <Text style={styles.boldText}>autopercepción del líder</Text> y la{' '}
                  <Text style={styles.boldText}>percepción de los colaboradores</Text> para cada pregunta específica de la práctica{' '}
                  <Text style={styles.positiveValue}>{category.category.name}</Text>. Las barras permiten identificar preguntas con mayor o
                  menor alineación perceptual.
                </Text>
              </View>
            </Page>

            {/* PÁGINA B: TABLA DETALLADA */}
            <Page size="LETTER" style={styles.page}>
              <Text style={styles.sectionTitle}>Detalle por Pregunta - {category.category.name}</Text>

              {/* Tabla detallada */}
              <View style={styles.table}>
                {/* Encabezado */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCellCenter, styles.col1]}>No.</Text>
                  <Text style={[styles.tableCell, styles.col2]}>PREGUNTA</Text>
                  <Text style={[styles.tableCellCenter, styles.col3]}>AUTOPERCEPCIÓN</Text>
                  <Text style={[styles.tableCellCenter, styles.col4]}>OBSERVADORES</Text>
                  <Text style={[styles.tableCellCenter, styles.col5]}>DIFERENCIA</Text>
                </View>

                {/* Filas de datos */}
                {category.questions.map((question, qIndex) => {
                  const difference = question.leader_avg - question.collaborator_avg;
                  const differenceStyle =
                    difference > 0 ? styles.positiveValue : difference < 0 ? styles.negativeValue : styles.neutralValue;

                  return (
                    <View key={qIndex} style={styles.tableRow}>
                      <Text style={[styles.tableCellCenter, styles.col1]}>{question.question_number}</Text>
                      <Text style={[styles.tableCell, styles.col2]}>{question.question_text}</Text>
                      <Text style={[styles.tableCellCenter, styles.col3, { color: '#1976d2', fontWeight: 700 }]}>
                        {question.leader_avg.toFixed(1)}
                      </Text>
                      <Text style={[styles.tableCellCenter, styles.col4, { color: '#d32f2f', fontWeight: 700 }]}>
                        {question.collaborator_avg.toFixed(1)}
                      </Text>
                      <Text style={[styles.tableCellCenter, styles.col5, differenceStyle]}>
                        {difference > 0 ? '+' : ''}
                        {difference.toFixed(1)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Resumen de la categoría */}
              <View style={styles.interpretationBox}>
                <Text style={styles.heading3}>Resumen de la Práctica</Text>

                <View style={styles.flexRow}>
                  <Text style={styles.paragraph}>
                    <Text style={styles.boldText}>Promedio Autopercepción:</Text>{' '}
                    {(category.questions.reduce((sum, q) => sum + q.leader_avg, 0) / category.questions.length).toFixed(1)}
                  </Text>
                  <Text style={styles.paragraph}>
                    <Text style={styles.boldText}>Promedio Observadores:</Text>{' '}
                    {(category.questions.reduce((sum, q) => sum + q.collaborator_avg, 0) / category.questions.length).toFixed(1)}
                  </Text>
                </View>

                <Text style={styles.paragraph}>
                  <Text style={styles.boldText}>Diferencia Promedio:</Text>{' '}
                  {(
                    category.questions.reduce((sum, q) => sum + (q.leader_avg - q.collaborator_avg), 0) / category.questions.length
                  ).toFixed(1)}
                </Text>
              </View>
            </Page>
          </React.Fragment>
        );
      })}
    </Document>
  );
};
