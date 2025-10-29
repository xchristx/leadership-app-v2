import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  type SxProps,
} from '@mui/material';
import type { CategoryData } from '../types';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import React from 'react';
import PracticeMedia from './PracticeMedia';

interface PageByCategoryProps {
  pageStyle: SxProps;
  categoryData: CategoryData[];
  LEADERSHIP_PRACTICES: {
    name: string;
    description: string;
  }[];
  barChartRefs: React.RefObject<(HTMLDivElement | null)[]>;
  hasSupervisorData: boolean;
}
const PageByCategory = ({ pageStyle, categoryData, LEADERSHIP_PRACTICES, barChartRefs, hasSupervisorData }: PageByCategoryProps) => {
  const { palette } = useTheme();
  return (
    <>
      {categoryData.map((category, categoryIndex) => {
        const practiceInfo = LEADERSHIP_PRACTICES.find(
          practice =>
            practice.name.toLowerCase().includes(category.category.name.toLowerCase()) ||
            category.category.name.toLowerCase().includes(practice.name.toLowerCase())
        );

        return (
          <React.Fragment key={categoryIndex}>
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
                  {/* Imagen más grande en PÁGINA A */}
                  <PracticeMedia
                    category={category.category.name}
                    index={categoryIndex}
                    imgSize={80}
                    dotSize={22}
                    sx={{ width: 50, height: 50 }}
                  />
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
                    {category.category.name}
                  </Typography>
                </Box>
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
                    padding: '10px',
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
                          DIRECTOR: q.supervisor_avg,
                        }))}
                        layout="vertical"
                        margin={{ top: 20, right: 40, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                        <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#252525' }} tickCount={6} />
                        <YAxis type="category" dataKey="pregunta" tick={{ fontSize: 11, width: 160, fill: '#252525' }} width={300} />
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
                            dataKey="DIRECTOR"
                            fill={palette.supervisor.main}
                            name="DIRECTOR"
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
                      , la <strong>percepción del DIRECTOR</strong>
                    </>
                  )}{' '}
                  y la <strong>percepción de los colaboradores</strong> para cada pregunta específica de la práctica{' '}
                  <span style={{ color: palette.success.main, fontWeight: '600' }}>{category.category.name}</span>. Las barras permiten
                  identificar preguntas con mayor o menor alineación perceptual.
                </Typography>
              </Box>
            </Paper>

            {/* PÁGINA B: CUADRO DETALLADO */}
            <Paper key={`${categoryIndex}-table-${category.category.name}`} sx={pageStyle} data-testid="page">
              {/* Encabezado compacto */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  mb: 2,
                  pb: 1,
                  borderBottom: '2px solid #e5e7eb',
                }}
              >
                <PracticeMedia category={category.category.name} index={categoryIndex} imgSize={56} dotSize={18} />
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#374151',
                    textAlign: 'center',
                  }}
                >
                  Detalle por Pregunta - {category.category.name}
                </Typography>
              </Box>

              {/* Tabla detallada compacta */}
              <TableContainer
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
                      {hasSupervisorData && (
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
                          DIRECTOR
                        </TableCell>
                      )}
                      {/* {hasSupervisorData && (
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
                          Promedio (DIRECTOR, Observadores)
                        </TableCell>
                      )} */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {category.questions.map((question, qIndex) => {
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
                            {question.leader_avg}
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
                          {hasSupervisorData && (
                            <TableCell
                              align="center"
                              sx={{
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                py: 0.5,
                                px: 1,
                                color: palette.supervisor.main,
                              }}
                            >
                              {question.supervisor_avg}
                            </TableCell>
                          )}
                          {/* {hasSupervisorData && (
                            <TableCell
                              align="center"
                              sx={{
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                py: 0.5,
                                px: 1,
                                color: palette.supervisor.main,
                              }}
                            >
                              {(question.collaborator_avg + question.supervisor_avg) / 2}
                            </TableCell>
                          )} */}
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
                  <Grid size={{ xs: hasSupervisorData ? 4 : 6 }}>
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
                  <Grid size={{ xs: hasSupervisorData ? 4 : 6 }}>
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
                  {hasSupervisorData && (
                    <Grid size={{ xs: hasSupervisorData ? 4 : 6 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: '700',
                          color: '#065f46',
                          fontSize: '0.9rem',
                          mb: 1,
                        }}
                      >
                        Promedio Director:
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color: palette.supervisor.main,
                          fontWeight: '700',
                          fontSize: '1.2rem',
                        }}
                      >
                        {(category.questions.reduce((sum, q) => sum + q.supervisor_avg, 0) / category.questions.length).toFixed(1)}
                      </Typography>
                    </Grid>
                  )}
                  {/* <Grid size={{ xs: 4 }}>
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
                          category.questions.reduce((sum, q) => sum + (q.collaborator_avg - q.leader_avg), 0) / category.questions.length >
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
                  </Grid> */}
                </Grid>
              </Box>
            </Paper>
            {/* {hasSupervisorData && (
              <Paper key={`${categoryIndex}-table`} sx={pageStyle} data-testid="page">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    mb: 2,
                    pb: 1,
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  <PracticeMedia category={category.category.name} index={categoryIndex} imgSize={56} dotSize={18} />
                  <Typography
                    variant="h5"
                    sx={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#374151',
                      textAlign: 'center',
                    }}
                  >
                    Detalle por Pregunta - {category.category.name} (DIRECTOR)
                  </Typography>
                </Box>

                <TableContainer
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
                          DIRECTOR
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
                        Promedio DIRECTOR:
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
            )} */}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default PageByCategory;
