// ============================================================================
// COMPONENTE CATEGORY ANALYSIS TAB
// ============================================================================
// Pestaña de análisis por categorías con resumen y detalle
// ============================================================================

import { Grid, Card, CardContent, Typography, Box, Alert, Button, useTheme } from '@mui/material';
import { CustomBarChart } from '../../Charts/BarChart';
import type { CategoryData, CategorySummary } from './types';

interface CategoryAnalysisTabProps {
  categoryData: CategoryData[];
  categorySummary?: CategorySummary[];
  loading: boolean;
  handleExportToExcel: () => void;
}

export function CategoryAnalysisTab({ categoryData, categorySummary = [], handleExportToExcel }: CategoryAnalysisTabProps) {
  const hasSupervisorData = categoryData.some(category =>
    category.questions.some(question => question.supervisor_responses && question.supervisor_responses.length > 0)
  );
  const { palette } = useTheme();
  return (
    <Box sx={{ px: { xs: 1, md: 5, lg: 10, xl: 20 } }}>
      {/* // <Box> */}
      <Button onClick={handleExportToExcel} variant="contained">
        Exportar a Excel
      </Button>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        📋 Resumen de Prácticas por Categoría
      </Typography>

      {categorySummary.length > 0 ? (
        <Grid container spacing={3}>
          {/* Tabla de resumen de categorías */}
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Resumen de Prácticas
                </Typography>
                <Box sx={{ overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>CATEGORÍA</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>AUTO</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>COLABORADORES</th>
                        {hasSupervisorData ? (
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>LÍDER DE LÍDER</th>
                        ) : (
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>DIFERENCIA</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {categorySummary.map((category, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '12px', fontWeight: 500 }}>{category.category}</td>
                          <td style={{ padding: '12px', textAlign: 'center', color: '#1976d2', fontWeight: 600 }}>
                            {category.auto_total.toFixed(1)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: '#9c27b0', fontWeight: 600 }}>
                            {category.otros_total.toFixed(1)}
                          </td>
                          {hasSupervisorData ? (
                            <td style={{ padding: '12px', textAlign: 'center', color: palette.supervisor.main, fontWeight: 600 }}>
                              {category.supervisor_total.toFixed(1)}
                            </td>
                          ) : (
                            <td
                              style={{
                                padding: '12px',
                                textAlign: 'center',
                                color: category.otros_total - category.auto_total > 0 ? palette.success.main : palette.error.main,
                                fontWeight: 600,
                              }}
                            >
                              {category.otros_total - category.auto_total > 0 ? '+' : ''}
                              {(category.otros_total - category.auto_total).toFixed(1)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de líneas para el resumen */}
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📈 Tendencias por Categoría
                </Typography>
                {categorySummary.length > 0 && (
                  <CustomBarChart
                    data={categorySummary.map((cat, index) => {
                      const catData = categoryData.find(c => c.category.name === cat.category);
                      const numQuestions = catData?.questions.length || 1;
                      const base = {
                        name: `Cat ${index + 1}`,
                        AUTO: Number((cat.auto_total / numQuestions).toFixed(1)),
                        COLABORADORES: Number((cat.otros_total / numQuestions).toFixed(1)),
                      };
                      if (hasSupervisorData) {
                        return {
                          ...base,
                          SUPERVISORES: Number((cat.supervisor_total / numQuestions).toFixed(1)),
                        };
                      }
                      return base;
                    })}
                    height={300}
                    xKey="name"
                    yKeys={hasSupervisorData ? ['AUTO', 'COLABORADORES', 'LÍDER DE  LÍDER'] : ['AUTO', 'COLABORADORES']}
                    colors={
                      hasSupervisorData
                        ? [palette.primary.main, palette.secondary.main, palette.supervisor.main]
                        : [palette.primary.main, palette.secondary.main]
                    }
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Detalle por categoría */}
          {categoryData.map((category, categoryIndex) => (
            <Grid size={{ xs: 12 }} key={categoryIndex}>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                    📁 {category.category.name}
                  </Typography>

                  <Box sx={{ overflow: 'auto', mb: 2 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>No.</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, minWidth: '300px' }}>PREGUNTA</th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>AUTO</th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>COLABORADORES</th>
                          {hasSupervisorData && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>LÍDER DE LÍDER</th>}
                          {/* Columnas dinámicas para cada colaborador */}
                          {category.questions.length > 0 &&
                            Array.from({ length: Math.max(...category.questions.map(q => q.collaborator_responses.length)) }, (_, i) => (
                              <th key={`col-${i}`} style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                                Col {i + 1}
                              </th>
                            ))}
                          {/* Columnas dinámicas para cada supervisor */}
                          {/* {category.questions.length > 0 &&
                            Array.from(
                              { length: Math.max(...category.questions.map(q => q.supervisor_responses?.length || 0)) },
                              (_, i) => (
                                <th key={`sup-${i}`} style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>
                                  Sup {i + 1}
                                </th>
                              )
                            )} */}
                        </tr>
                      </thead>
                      <tbody>
                        {category.questions.map((question, questionIndex) => {
                          const maxCollaborators = Math.max(...category.questions.map(q => q.collaborator_responses.length));
                          // const maxSupervisors = Math.max(...category.questions.map(q => q.supervisor_responses?.length || 0));

                          return (
                            <tr key={questionIndex} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '12px', textAlign: 'center', fontWeight: 500 }}>{question.question_number}</td>
                              <td style={{ padding: '12px', maxWidth: '300px' }}>{question.question_text}</td>
                              <td style={{ padding: '12px', textAlign: 'center', color: '#1976d2', fontWeight: 600 }}>
                                {question.leader_avg.toFixed(1)}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', color: '#9c27b0', fontWeight: 600 }}>
                                {question.collaborator_avg.toFixed(1)}
                              </td>
                              {hasSupervisorData && (
                                <td style={{ padding: '12px', textAlign: 'center', color: palette.supervisor.main, fontWeight: 600 }}>
                                  {question.supervisor_avg.toFixed(1)}
                                </td>
                              )}
                              {/* Columnas de respuestas individuales de colaboradores */}
                              {Array.from({ length: maxCollaborators }, (_, i) => (
                                <td
                                  key={`col-resp-${i}`}
                                  style={{
                                    padding: '12px',
                                    textAlign: 'center',
                                    color: '#666',
                                    fontWeight: 500,
                                  }}
                                >
                                  {question.collaborator_responses[i] ? question.collaborator_responses[i].toFixed(1) : '-'}
                                </td>
                              ))}
                              {/* Columnas de respuestas individuales de supervisores */}
                              {/* {Array.from({ length: maxSupervisors }, (_, i) => (
                                <td
                                  key={`sup-resp-${i}`}
                                  style={{
                                    padding: '12px',
                                    textAlign: 'center',
                                    color: '#ff6b35',
                                    fontWeight: 500,
                                  }}
                                >
                                  {question.supervisor_responses?.[i] ? question.supervisor_responses[i].toFixed(1) : '-'}
                                </td>
                              ))} */}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Box>

                  {/* Gráfico de barras para cada categoría */}
                  <CustomBarChart
                    data={category.questions.map(q => {
                      const base = {
                        name: `P${q.question_number}`,
                        AUTO: q.leader_avg,
                        COLABORADORES: q.collaborator_avg,
                      };
                      if (hasSupervisorData) {
                        return {
                          ...base,
                          SUPERVISORES: q.supervisor_avg,
                        };
                      }
                      return base;
                    })}
                    height={250}
                    xKey="name"
                    yKeys={hasSupervisorData ? ['AUTO', 'COLABORADORES', 'SUPERVISORES'] : ['AUTO', 'COLABORADORES']}
                    colors={[palette.primary.main, palette.secondary.main, palette.supervisor.main]}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">No hay datos de categorías disponibles.</Alert>
      )}
    </Box>
  );
}
